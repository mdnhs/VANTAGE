import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/server/api';
import { AI_CHAT_LIMIT } from '@/server/api/admin-ai';
import { db } from '@/server/db';
import { aiConversations, aiMessages, auditLogs, settings } from '@/server/db/schema';
import { hitLimit } from '@/server/lib/rate-limit-db';
import { appendMessage, createConversation, historyFor } from '@/server/repositories/ai-conversation-repository';
import { DECLINED_MESSAGE, LENGTH_EXHAUSTED_MESSAGE } from '@/server/services/ai/errors';

import { call, createTestUser, ORIGIN, signInCookie, viewAsCookie } from '../support/session';

vi.mock('@/server/repositories/ai-conversation-repository', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/server/repositories/ai-conversation-repository')>();
  return { ...original, historyFor: vi.fn(original.historyFor) };
});

type Chunk = { type: string; delta?: string; errorText?: string; output?: unknown; messageMetadata?: unknown };

// Reads the whole SSE body into its JSON chunks.
const readChunks = async (res: Response): Promise<Chunk[]> =>
  (await res.text())
    .split('\n')
    .filter((line) => line.startsWith('data: ') && line !== 'data: [DONE]')
    .map((line) => JSON.parse(line.slice(6)) as Chunk);
const textOfChunks = (chunks: Chunk[]) =>
  chunks
    .filter((c) => c.type === 'text-delta')
    .map((c) => c.delta)
    .join('');

// The save + audit run when the stream closes, a moment after the body is read.
async function settled<T>(read: () => Promise<T | null | undefined | false>): Promise<T> {
  for (let i = 0; i < 100; i++) {
    const value = await read();
    if (value) return value;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('timed out waiting for the chat to settle');
}

const aiSettings = (over: Record<string, unknown> = {}) => ({
  enabled: true,
  provider: 'google',
  model: 'gemini-flash-lite-latest',
  baseUrl: '',
  apiKeyEncrypted: null,
  apiKeyHint: null,
  allowedRoles: ['editor', 'author', 'marketer', 'intake', 'viewer'],
  shareEnquiryDetails: { enabled: false, acknowledgedAt: null, acknowledgedBy: null },
  systemPrompt: '',
  maxOutputTokens: 1024,
  ...over,
});
const saveSettings = async (over: Record<string, unknown> = {}) => {
  await db.execute(sql`truncate table settings`);
  await db.insert(settings).values({ key: 'ai', value: aiSettings(over), version: 1 });
};

const chat = (cookie: string, body: unknown) => call('/admin/ai/chat', cookie, { method: 'POST', body });

const users = {} as Record<'owner' | 'admin' | 'editor' | 'viewer', { id: string; cookie: string }>;
beforeAll(async () => {
  for (const role of ['owner', 'admin', 'editor', 'viewer'] as const) {
    const user = await createTestUser(role);
    users[role] = { id: user.id, cookie: await signInCookie(user.email) };
  }
});

beforeEach(async () => {
  vi.stubEnv('AI_PROVIDER_MOCK', 'true');
  await db.execute(sql`truncate table ai_messages, ai_conversations, audit_logs, rate_limits`);
  await saveSettings();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const chatAudits = async () => (await db.select().from(auditLogs)).filter((r) => r.action === 'ai.chat');
const messages = (conversationId: string) =>
  db.select().from(aiMessages).where(eq(aiMessages.conversationId, conversationId)).orderBy(aiMessages.createdAt);

describe('POST /admin/ai/chat', () => {
  it('streams a mock reply and saves both messages', async () => {
    const res = await chat(users.editor.cookie, { text: 'hello' });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-cache, no-transform');
    const chunks = await readChunks(res);
    expect(textOfChunks(chunks)).toBe('Mock reply: hello');
    const start = chunks.find((c) => c.type === 'start');
    expect(start?.messageMetadata).toMatchObject({
      conversationId: expect.any(String),
      userMessageId: expect.any(String),
    });

    const [audited] = await settled(async () => {
      const rows = await chatAudits();
      return rows.length ? rows : null;
    });
    expect(audited!.summary).toMatch(/^Asked the AI assistant \(google · .+ · \d+ in \/ \d+ out tokens\)$/);
    expect(audited!.summary).not.toContain('hello');
    const [conversation] = await db.select().from(aiConversations);
    const rows = await messages(conversation!.id);
    expect(rows.map((r) => r.role)).toEqual(['user', 'assistant']);
    expect(rows[1]!.parts).toEqual([{ type: 'text', text: 'Mock reply: hello' }]);
    expect(await chatAudits()).toHaveLength(1);
  });

  it('a SEO question runs getSeoHealth and saves only its label', async () => {
    const res = await chat(users.owner.cookie, { text: 'how is our SEO?' });
    const chunks = await readChunks(res);
    const outputs = chunks.filter((c) => c.type === 'tool-output-available');
    expect(outputs).toHaveLength(1);
    expect(outputs[0]!.output).toEqual({ label: 'SEO health' });
    expect(JSON.stringify(chunks)).not.toContain('"score"');
    await settled(async () => ((await chatAudits()).length ? true : null));
    const assistant = (await db.select().from(aiMessages)).find((m) => m.role === 'assistant')!;
    const tool = (assistant.parts as { type: string; output?: unknown }[]).find((p) => p.type === 'tool-getSeoHealth');
    expect(tool?.output).toEqual({ label: 'SEO health' });
    expect((await chatAudits())[0]!.summary).toContain('tools: getSeoHealth');
  });

  it('refuses when disabled or role gated', async () => {
    await saveSettings({ enabled: false });
    const off = await chat(users.viewer.cookie, { text: 'hi' });
    expect(off.status).toBe(403);
    expect((await off.json()).error.message).toBe('The AI assistant is turned off');

    await saveSettings({ allowedRoles: [] });
    const gated = await chat(users.viewer.cookie, { text: 'hi' });
    expect(gated.status).toBe(403);
    expect((await gated.json()).error.message).toBe("The AI assistant isn't available for your role");
    const admin = await chat(users.admin.cookie, { text: 'hi' });
    expect(admin.status).toBe(200);
    await readChunks(admin);
    expect(await db.select().from(aiMessages).where(eq(aiMessages.role, 'user'))).toHaveLength(1);
  });

  it("another person's conversationId or editMessageId is 404 and writes nothing", async () => {
    const theirs = await createConversation(users.owner.id, 'Theirs', 'm');
    const theirMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: 'secret' }],
    };
    await appendMessage(theirs.id, theirMessage);
    const mine = await createConversation(users.editor.id, 'Mine', 'm');
    await appendMessage(mine.id, { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text: 'mine' }] });

    const attempts = [
      [{ text: 'x', conversationId: theirs.id }, 'Conversation not found'],
      [{ conversationId: theirs.id, regenerate: true }, 'Conversation not found'],
      [{ text: 'x', conversationId: theirs.id, editMessageId: theirMessage.id }, 'Conversation not found'],
      [{ text: 'x', conversationId: mine.id, editMessageId: theirMessage.id }, 'Message not found'],
    ] as const;
    for (const [body, message] of attempts) {
      const res = await chat(users.editor.cookie, body);
      expect(res.status).toBe(404);
      expect((await res.json()).error.message).toBe(message);
    }
    expect(await db.select().from(aiMessages)).toHaveLength(2);
    expect(await chatAudits()).toHaveLength(0);
  });

  it('regenerate replaces the last reply; edit replaces the message and what follows', async () => {
    const first = await chat(users.editor.cookie, { text: 'one' });
    const conversationId = (await readChunks(first)).find((c) => c.type === 'start')!.messageMetadata as {
      conversationId: string;
    };
    const id = conversationId.conversationId;
    await settled(async () => ((await messages(id)).length === 2 ? true : null));
    await readChunks(await chat(users.editor.cookie, { text: 'two', conversationId: id }));
    await settled(async () => ((await messages(id)).length === 4 ? true : null));

    const [replyBefore] = (await messages(id)).slice(-1);
    await readChunks(await chat(users.editor.cookie, { conversationId: id, regenerate: true }));
    await settled(async () => {
      const rows = await messages(id);
      return rows.length === 4 && rows[3]!.id !== replyBefore!.id ? true : null;
    });
    expect((await messages(id)).map((m) => (m.parts as { text: string }[])[0]!.text)).toEqual([
      'one',
      'Mock reply: one',
      'two',
      'Mock reply: two',
    ]);
    expect((await chatAudits()).some((a) => a.summary.includes('· regenerated'))).toBe(true);

    const secondUser = (await messages(id))[2]!;
    await readChunks(
      await chat(users.editor.cookie, { conversationId: id, editMessageId: secondUser.id, text: 'two edited' }),
    );
    await settled(async () => ((await messages(id)).length === 4 ? true : null));
    expect((await messages(id)).map((m) => (m.parts as { text: string }[])[0]!.text)).toEqual([
      'one',
      'Mock reply: one',
      'two edited',
      'Mock reply: two edited',
    ]);
    expect((await chatAudits()).some((a) => a.summary.includes('· edited'))).toBe(true);
  });

  it('regenerate keeps the old reply when the provider gives no answer', async () => {
    const conversation = await createConversation(users.editor.id, 'x', 'm');
    await appendMessage(conversation.id, {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: 'length-test' }],
    });
    const old = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      parts: [{ type: 'text' as const, text: 'OLD REPLY' }],
    };
    await appendMessage(conversation.id, old);
    const chunks = await readChunks(
      await chat(users.editor.cookie, { conversationId: conversation.id, regenerate: true }),
    );
    expect(chunks.find((c) => c.type === 'error')?.errorText).toBe(LENGTH_EXHAUSTED_MESSAGE);
    await settled(async () => ((await chatAudits()).length === 1 ? true : null));
    const rows = await messages(conversation.id);
    expect(rows.map((r) => r.id)).toContain(old.id);
    expect(rows).toHaveLength(2);
  });

  it('GET conversation hides shared replies once sharing is off', async () => {
    const conversation = await createConversation(users.owner.id, 'Shared', 'm');
    await appendMessage(conversation.id, {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: 'q1' }],
    });
    await appendMessage(
      conversation.id,
      { id: crypto.randomUUID(), role: 'assistant', parts: [{ type: 'text', text: 'SHARED-ENQUIRY-REPLY' }] },
      { sharedEnquiryDetails: true },
    );
    const read = async () =>
      JSON.stringify(
        (await (await call(`/admin/ai/conversations/${conversation.id}`, users.owner.cookie)).json()).data,
      );
    expect(await read()).not.toContain('SHARED-ENQUIRY-REPLY');
    expect(await read()).toContain('Hidden: this reply used enquiry details, and sharing is now off.');
    await saveSettings({
      shareEnquiryDetails: { enabled: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'o@x.ie' },
    });
    expect(await read()).toContain('SHARED-ENQUIRY-REPLY');
  });

  it('drops shared replies from history once sharing is off', async () => {
    const conversation = await createConversation(users.owner.id, 'Shared', 'm');
    await appendMessage(conversation.id, {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: 'q1' }],
    });
    await appendMessage(
      conversation.id,
      { id: crypto.randomUUID(), role: 'assistant', parts: [{ type: 'text', text: 'SHARED-ENQUIRY-REPLY' }] },
      { sharedEnquiryDetails: true },
    );
    const historyTexts = async () => {
      const results = vi.mocked(historyFor).mock.results;
      const last = await results[results.length - 1]!.value;
      return JSON.stringify(last);
    };

    await saveSettings({ shareEnquiryDetails: { enabled: false, acknowledgedAt: null, acknowledgedBy: null } });
    await readChunks(await chat(users.owner.cookie, { text: 'q2', conversationId: conversation.id }));
    expect(await historyTexts()).not.toContain('SHARED-ENQUIRY-REPLY');

    await saveSettings({
      shareEnquiryDetails: { enabled: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'o@x.ie' },
    });
    await readChunks(await chat(users.owner.cookie, { text: 'q3', conversationId: conversation.id }));
    expect(await historyTexts()).toContain('SHARED-ENQUIRY-REPLY');
  });

  it('saves partial reply on abort', async () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
    const full = `Mock reply: ${long}`;
    const controller = new AbortController();
    const res = await api.request('/api/v1/admin/ai/chat', {
      method: 'POST',
      headers: { origin: ORIGIN, cookie: users.editor.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ text: long }),
      signal: controller.signal,
    });
    expect(res.status).toBe(200);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let seen = '';
    while (!seen.includes('text-delta')) {
      const { value, done } = await reader.read();
      if (done) break;
      seen += decoder.decode(value);
    }
    controller.abort();
    await reader.cancel().catch(() => {});

    const audit = await settled(async () => (await chatAudits())[0]);
    expect(audit.summary).toMatch(/· stopped\)$/);
    const assistant = (await db.select().from(aiMessages)).find((m) => m.role === 'assistant');
    expect(assistant).toBeDefined();
    const text = (assistant!.parts as { type: string; text: string }[]).map((p) => p.text).join('');
    expect(text.length).toBeGreaterThan(0);
    expect(full.startsWith(text)).toBe(true);
    expect(text.length).toBeLessThan(full.length);
    expect(audit.summary).not.toContain('word1');
  });

  it('maps length-exhausted and declined finishes to friendly errors', async () => {
    const length = await readChunks(await chat(users.editor.cookie, { text: 'length-test' }));
    expect(length.find((c) => c.type === 'error')?.errorText).toBe(LENGTH_EXHAUSTED_MESSAGE);
    await settled(async () => ((await chatAudits()).length === 1 ? true : null));
    const decline = await readChunks(await chat(users.editor.cookie, { text: 'decline-test' }));
    expect(decline.find((c) => c.type === 'error')?.errorText).toBe(DECLINED_MESSAGE);
    await settled(async () => ((await chatAudits()).length === 2 ? true : null));
    expect((await db.select().from(aiMessages)).filter((m) => m.role === 'assistant')).toHaveLength(0);
  });

  it('answers 503 when the assistant is enabled but has no key', async () => {
    vi.stubEnv('AI_PROVIDER_MOCK', 'false');
    const res = await chat(users.editor.cookie, { text: 'hello' });
    expect(res.status).toBe(503);
    expect((await res.json()).error.message).toMatch(/isn't set up yet/);
    expect(await db.select().from(aiMessages)).toHaveLength(0);
    expect(await db.select().from(aiConversations)).toHaveLength(0);
  });

  it('the 31st message in 10 minutes is 429 with Retry-After', async () => {
    for (let i = 0; i < AI_CHAT_LIMIT.limit; i++) {
      await hitLimit(`ai-chat:user:${users.editor.id}`, AI_CHAT_LIMIT);
    }
    const res = await chat(users.editor.cookie, { text: 'one too many' });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await db.select().from(aiMessages)).toHaveLength(0);
  });
});

describe('conversations', () => {
  it("lists, reads and deletes only the caller's own", async () => {
    const mine = await createConversation(users.editor.id, 'Mine', 'm');
    await appendMessage(mine.id, { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text: 'Mine' }] });
    const theirs = await createConversation(users.viewer.id, 'Theirs', 'm');
    const list = await (await call('/admin/ai/conversations', users.editor.cookie)).json();
    expect(list.data.items.map((c: { title: string }) => c.title)).toEqual(['Mine']);
    expect((await call(`/admin/ai/conversations/${mine.id}`, users.editor.cookie)).status).toBe(200);
    expect((await call(`/admin/ai/conversations/${theirs.id}`, users.editor.cookie)).status).toBe(404);
    expect((await call(`/admin/ai/conversations/${theirs.id}`, users.editor.cookie, { method: 'DELETE' })).status).toBe(
      404,
    );
    expect((await call(`/admin/ai/conversations/${mine.id}`, users.editor.cookie, { method: 'DELETE' })).status).toBe(
      200,
    );
    expect((await call('/admin/ai/conversations/not-a-uuid', users.editor.cookie)).status).toBe(422);
  });

  it("View-as can list and read the viewed person's conversations but not send or delete", async () => {
    const theirs = await createConversation(users.admin.id, 'Admin chat', 'm');
    await appendMessage(theirs.id, { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text: 'hi' }] });
    const viewing = await viewAsCookie(users.owner.cookie, users.admin.id);
    const list = await (await call('/admin/ai/conversations', viewing)).json();
    expect(list.data.items).toHaveLength(1);
    expect((await call(`/admin/ai/conversations/${theirs.id}`, viewing)).status).toBe(200);
    for (const res of [
      await chat(viewing, { text: 'hi' }),
      await call(`/admin/ai/conversations/${theirs.id}`, viewing, { method: 'DELETE' }),
    ]) {
      expect(res.status).toBe(403);
      expect((await res.json()).error.code).toBe('IMPERSONATION_READ_ONLY');
    }
    expect(await db.select().from(aiConversations)).toHaveLength(1);
  });
});
