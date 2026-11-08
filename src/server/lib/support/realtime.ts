import 'server-only';

import { sql } from 'drizzle-orm';
import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { Client } from 'pg';

import type { SupportEvent } from '@/lib/support/types';
import { db } from '@/server/db';
import { ApiError } from '@/server/lib/errors';

import { createPresence } from './presence';

const CHANNEL = 'support_chat';
const HEARTBEAT_MS = 25_000;
// A stream ends after this long and the browser reconnects, which re-runs the auth guards:
// a banned or demoted agent cannot keep an old stream open.
const MAX_STREAM_MS = 10 * 60_000;
const RECONNECT_MS = 3_000;
const MAX_STREAMS = 500;
// The rest of MAX_STREAMS is kept for staff, so visitors can never lock the team out.
const MAX_VISITOR_STREAMS = 400;
// A few tabs of one chat is normal; more is one visitor trying to use up the slots.
const MAX_STREAMS_PER_CHAT = 3;
const PRESENCE_GRACE_MS = 30_000;
const LIVENESS_MS = 30_000;
const LIVENESS_TIMEOUT_MS = 10_000;

export type HubEvent = SupportEvent | { type: 'resync' };
type Listener = (event: HubEvent) => void;

// One LISTEN connection per process, shared by every open stream, so streams never hold
// a connection from the small query pool. It opens with the first stream and closes with
// the last. Kept on globalThis so dev reloads and Next's route bundles share a single hub.
type Hub = {
  listeners: Set<Listener>;
  agents: Map<string, number>;
  client: Client | null;
  ready: Promise<void> | null;
  timer: ReturnType<typeof setTimeout> | null;
};
const globalForHub = globalThis as unknown as { supportHub?: Hub; supportChatStreams?: Map<string, number> };
const chatStreams = (globalForHub.supportChatStreams ??= new Map<string, number>());
const hub: Hub = (globalForHub.supportHub ??= {
  listeners: new Set(),
  agents: new Map(),
  client: null,
  ready: null,
  timer: null,
});

const broadcast = (event: HubEvent) => {
  for (const listener of hub.listeners) listener(event);
};

function disconnect() {
  if (hub.timer) clearTimeout(hub.timer);
  hub.timer = null;
  const client = hub.client;
  hub.client = null;
  hub.ready = null;
  if (client) {
    client.removeAllListeners();
    // A late socket error must not become an uncaught exception.
    client.on('error', () => {});
    void client.end().catch(() => {});
  }
}

function connect(): Promise<void> {
  if (hub.ready) return hub.ready;
  const client = new Client({
    connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    keepAlive: true,
    connectionTimeoutMillis: LIVENESS_TIMEOUT_MS,
    query_timeout: LIVENESS_TIMEOUT_MS,
  });
  hub.client = client;

  const drop = () => {
    if (hub.client !== client) return;
    disconnect();
    if (hub.listeners.size === 0) return;
    console.error('[support] event connection lost, reconnecting');
    hub.timer = setTimeout(() => {
      hub.timer = null;
      // Anything sent during the gap was missed, so clients re-read once it is back.
      connect()
        .then(() => broadcast({ type: 'resync' }))
        .catch(drop);
    }, RECONNECT_MS);
  };
  client.on('error', drop);
  client.on('end', drop);
  // A silently dead connection raises no event and would just stop delivering, so probe it.
  const liveness = setInterval(() => {
    if (hub.client !== client) return clearInterval(liveness);
    client.query('select 1').catch(drop);
  }, LIVENESS_MS);
  liveness.unref();
  client.on('notification', (message) => {
    if (message.channel !== CHANNEL || !message.payload) return;
    try {
      broadcast(JSON.parse(message.payload) as SupportEvent);
    } catch {
      console.error('[support] unreadable event');
    }
  });

  hub.ready = client
    .connect()
    .then(() => client.query(`LISTEN ${CHANNEL}`))
    .then(() => undefined)
    .catch((error: unknown) => {
      drop();
      throw error;
    });
  return hub.ready;
}

async function subscribe(listener: Listener): Promise<() => void> {
  hub.listeners.add(listener);
  const unsubscribe = () => {
    hub.listeners.delete(listener);
    if (hub.listeners.size === 0) disconnect();
  };
  try {
    await connect();
  } catch (error) {
    unsubscribe();
    throw error;
  }
  return unsubscribe;
}

// Never throws: the message is already saved, and clients catch up on their next read.
export async function publishSupportEvent(event: SupportEvent): Promise<void> {
  try {
    await db.execute(sql`select pg_notify(${CHANNEL}, ${JSON.stringify(event)})`);
  } catch {
    console.error('[support] event not published');
  }
}

// Per process, which is right for the single production container. A second replica would need this shared.
const presence = createPresence(hub.agents, PRESENCE_GRACE_MS);
export const agentsOnline = presence.anyOnline;
export const isAgentOnline = presence.isOnline;

function holdChatSlot(chatId: string): () => void {
  const held = chatStreams.get(chatId) ?? 0;
  if (held >= MAX_STREAMS_PER_CHAT) throw new ApiError('RATE_LIMITED', 'This chat is open in too many tabs', 429);
  chatStreams.set(chatId, held + 1);
  return () => {
    const left = (chatStreams.get(chatId) ?? 1) - 1;
    if (left > 0) chatStreams.set(chatId, left);
    else chatStreams.delete(chatId);
  };
}

export function supportStream(
  c: Context,
  {
    accept,
    agentId,
    visitorChatId,
  }: {
    accept: (event: SupportEvent) => boolean;
    agentId?: string | null;
    // Set for visitor streams. Visitors only need to know something changed, never which staff user holds the chat.
    visitorChatId?: string;
  },
) {
  if (hub.listeners.size >= (visitorChatId ? MAX_VISITOR_STREAMS : MAX_STREAMS)) {
    throw new ApiError('SERVICE_UNAVAILABLE', 'Chat is busy, try again soon', 503);
  }
  const releaseChatSlot = visitorChatId ? holdChatSlot(visitorChatId) : () => {};
  // no-transform keeps Next's compression from buffering the stream.
  c.header('Cache-Control', 'no-cache, no-transform');
  c.header('X-Accel-Buffering', 'no');

  return streamSSE(
    c,
    async (stream) => {
      const queue: HubEvent[] = [];
      let wake = () => {};
      const unsubscribe = await subscribe((event) => {
        if (event.type !== 'resync' && !accept(event)) return;
        queue.push(event);
        wake();
      }).catch((error: unknown) => {
        releaseChatSlot();
        throw error;
      });
      const untrack = agentId ? presence.hold(agentId) : () => {};
      stream.onAbort(() => wake());

      try {
        // Sent only once LISTEN is live: the client re-reads on it, so nothing falls in the gap.
        await stream.writeSSE({ event: 'ready', data: '{}' });
        const deadline = Date.now() + MAX_STREAM_MS;
        while (!stream.aborted && !stream.closed && Date.now() < deadline) {
          if (queue.length === 0) {
            const woken = await new Promise<boolean>((resolve) => {
              const timer = setTimeout(() => resolve(false), HEARTBEAT_MS);
              wake = () => {
                clearTimeout(timer);
                resolve(true);
              };
            });
            // A comment line: keeps Cloudflare's idle timeout away and is ignored by EventSource.
            if (!woken && !stream.aborted) await stream.write(': ping\n\n');
            continue;
          }
          for (const event of queue.splice(0)) {
            await stream.writeSSE({ event: event.type, data: JSON.stringify(visitorChatId ? {} : event) });
          }
        }
      } finally {
        untrack();
        unsubscribe();
        releaseChatSlot();
      }
    },
    async () => {
      // A write to a closed connection lands here; the finally above has already cleaned up.
    },
  );
}
