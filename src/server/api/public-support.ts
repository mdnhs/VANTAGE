import { randomUUID } from 'node:crypto';

import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie } from 'hono/cookie';

import type { AppEnv } from '@/server/api/types';
import { ApiError } from '@/server/lib/errors';
import { ok } from '@/server/lib/response';
import { supportStream } from '@/server/lib/support/realtime';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import { supportService } from '@/server/services/support-service';
import { supportMessageSchema, supportStartSchema, supportVisitorContactSchema } from '@/validations/support-schema';

// Strictly necessary: set only when the visitor starts a chat, and it is the only thing
// that proves a chat is theirs. httpOnly, so page scripts can never read it.
const COOKIE = 'support_chat';
const COOKIE_PATH = '/api/v1/public/support';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const SMALL_BODY = bodyLimit({
  maxSize: 16 * 1024,
  onError: () => {
    throw ApiError.payloadTooLarge('That message is too long');
  },
});

const currentChat = (c: Context<AppEnv>) => supportService.byVisitorToken(getCookie(c, COOKIE));

async function requireChat(c: Context<AppEnv>) {
  const row = await currentChat(c);
  if (!row) throw ApiError.unauthorized('Start a chat first');
  return row;
}

export const publicSupport = new Hono<AppEnv>()
  .use('*', async (c, next) => {
    await next();
    if (!c.res.headers.has('Cache-Control')) c.res.headers.set('Cache-Control', 'no-store');
  })

  // Read from memory, no database: safe to call on every page load.
  .get('/status', rateLimit(120, 60_000), (c) => ok(c, supportService.status()))

  .get('/conversation', rateLimit(240, 60_000), async (c) => {
    const row = await currentChat(c);
    return ok(c, row ? await supportService.visitorConversation(row) : null);
  })

  // Separate from /messages because each path has its own rate-limit bucket, and new
  // chats (a new database row each) need a far tighter limit than messages in one.
  .post('/conversations', rateLimit(5, 10 * 60_000), SMALL_BODY, zValidator('json', supportStartSchema), async (c) => {
    const { website, ...input } = c.req.valid('json');
    // A bot gets a normal-looking answer, and nothing is stored or sent to the team.
    if (website) {
      return ok(
        c,
        { id: randomUUID(), status: 'open', agentName: null, hasEmail: false, aiActive: false, messages: [] },
        { status: 201 },
      );
    }
    const { token, conversation } = await supportService.start(input);
    setCookie(c, COOKIE, token, {
      path: COOKIE_PATH,
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
    });
    return ok(c, conversation, { status: 201 });
  })

  .post('/messages', rateLimit(30, 60_000), SMALL_BODY, zValidator('json', supportMessageSchema), async (c) => {
    const row = await requireChat(c);
    return ok(c, await supportService.visitorSend(row, c.req.valid('json').body), { status: 201 });
  })

  .post('/contact', rateLimit(10, 60_000), SMALL_BODY, zValidator('json', supportVisitorContactSchema), async (c) => {
    const row = await requireChat(c);
    return ok(c, await supportService.visitorContact(row, c.req.valid('json')));
  })

  .get('/stream', rateLimit(60, 60_000), async (c) => {
    const row = await requireChat(c);
    return supportStream(c, { accept: (event) => event.conversationId === row.id, visitorChatId: row.id });
  });
