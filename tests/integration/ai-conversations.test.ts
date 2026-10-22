import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import type { AiUIMessage } from '@/lib/ai/messages';
import { db } from '@/server/db';
import { aiConversations, aiMessages, auditLogs, users } from '@/server/db/schema';
import {
  appendMessage,
  createConversation,
  deleteConversation,
  getConversation,
  HIDDEN_SHARED_REPLY,
  historyFor,
  listConversations,
  ownConversation,
  ownUserMessage,
  purgeStaleConversations,
  replaceFrom,
  runAiRetention,
  titleFrom,
} from '@/server/repositories/ai-conversation-repository';

import { createTestUser } from '../support/session';

const DAY = 86_400_000;
const SHARE = { includeShared: true };
const NOW = new Date();
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const text = (role: 'user' | 'assistant', t: string): AiUIMessage => ({
  id: crypto.randomUUID(),
  role,
  parts: [{ type: 'text', text: t }],
});

let a: string;
let b: string;

beforeEach(async () => {
  await db.execute(sql`truncate table ai_messages, ai_conversations, audit_logs, users cascade`);
  a = (await createTestUser('editor')).id;
  b = (await createTestUser('viewer')).id;
});
afterAll(async () => {
  await db.execute(sql`truncate table ai_messages, ai_conversations, audit_logs, users cascade`);
});

const status = async (p: Promise<unknown>) =>
  p.then(
    () => 0,
    (e: { status?: number }) => e.status,
  );

describe('ai conversations', () => {
  it("lists, reads and deletes only the owner's conversations", async () => {
    const mine = await createConversation(a, 'Mine', 'm');
    await appendMessage(mine.id, text('user', 'Mine'));
    await createConversation(b, 'Theirs', 'm');
    expect((await listConversations(a)).map((c) => c.title)).toEqual(['Mine']);
    expect((await getConversation(a, mine.id, SHARE)).messages).toHaveLength(1);
    expect(await status(ownConversation(b, mine.id))).toBe(404);
    expect(await status(getConversation(b, mine.id, SHARE))).toBe(404);
    expect(await status(deleteConversation({ userId: b }, mine.id))).toBe(404);
    expect(await db.select().from(aiConversations).where(eq(aiConversations.id, mine.id))).toHaveLength(1);
  });

  it('deleting a user cascades conversations and messages', async () => {
    const c = await createConversation(a, 'x', 'm');
    await appendMessage(c.id, text('user', 'x'));
    await db.delete(users).where(eq(users.id, a));
    expect(await db.select().from(aiConversations)).toHaveLength(0);
    expect(await db.select().from(aiMessages)).toHaveLength(0);
  });

  it('appendMessage bumps updatedAt and keeps token counts', async () => {
    const c = await createConversation(a, 'x', 'm');
    await db
      .update(aiConversations)
      .set({ updatedAt: daysAgo(5) })
      .where(eq(aiConversations.id, c.id));
    await appendMessage(c.id, text('assistant', 'hi'), { tokensIn: 7, tokensOut: 9, sharedEnquiryDetails: true });
    const [conv] = await db.select().from(aiConversations);
    expect(conv!.updatedAt.getTime()).toBeGreaterThan(daysAgo(1).getTime());
    const [m] = await db.select().from(aiMessages);
    expect(m).toMatchObject({ tokensIn: 7, tokensOut: 9, sharedEnquiryDetails: true });
  });

  it('replaceFrom drops the edited message and everything after it', async () => {
    const c = await createConversation(a, 'x', 'm');
    const rows = [text('user', 'one'), text('assistant', 'two'), text('user', 'three'), text('assistant', 'four')];
    for (const [i, m] of rows.entries()) {
      await appendMessage(c.id, m);
      await db
        .update(aiMessages)
        .set({ createdAt: daysAgo(10 - i) })
        .where(eq(aiMessages.id, m.id));
    }
    const target = await ownUserMessage(c.id, rows[2]!.id);
    expect(await status(ownUserMessage(c.id, rows[1]!.id))).toBe(404);
    await replaceFrom(c.id, target, text('user', 'three edited'));
    const left = (await getConversation(a, c.id, SHARE)).messages.map((m) => m.parts[0]);
    expect(left).toEqual([
      { type: 'text', text: 'one' },
      { type: 'text', text: 'two' },
      { type: 'text', text: 'three edited' },
    ]);
  });

  it('historyFor excludes sharedEnquiryDetails rows unless includeShared, text parts only', async () => {
    const c = await createConversation(a, 'x', 'm');
    await appendMessage(c.id, text('user', 'q'));
    await appendMessage(
      c.id,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [
          { type: 'text', text: 'shared reply' },
          { type: 'tool-getPage', toolCallId: 't', state: 'output-available', input: {}, output: { label: 'L' } },
        ] as AiUIMessage['parts'],
      },
      { sharedEnquiryDetails: true },
    );
    expect((await historyFor(c.id, 20, { includeShared: false })).map((m) => m.role)).toEqual(['user']);
    const all = await historyFor(c.id, 20, { includeShared: true });
    expect(all).toHaveLength(2);
    expect(all[1]!.parts).toEqual([{ type: 'text', text: 'shared reply' }]);
  });

  it('purgeStaleConversations removes old messages, then empty or idle conversations, and keeps fresh ones', async () => {
    const fresh = await createConversation(a, 'fresh', 'm');
    await appendMessage(fresh.id, text('user', 'f1'));
    await appendMessage(fresh.id, text('assistant', 'f2'));
    // idle: updated 91 days ago, its one message is also old
    const idle = await createConversation(a, 'idle', 'm');
    await appendMessage(idle.id, text('user', 'i1'));
    // emptied: its only message is 100 days old
    const emptied = await createConversation(a, 'emptied', 'm');
    await appendMessage(emptied.id, text('user', 'e1'));
    await appendMessage(emptied.id, text('assistant', 'e2'));
    await db
      .update(aiMessages)
      .set({ createdAt: daysAgo(100) })
      .where(sql`${aiMessages.conversationId} in (${idle.id}, ${emptied.id})`);
    await db
      .update(aiConversations)
      .set({ updatedAt: daysAgo(91) })
      .where(eq(aiConversations.id, idle.id));
    await db
      .update(aiConversations)
      .set({ createdAt: daysAgo(100) })
      .where(eq(aiConversations.id, emptied.id));
    const result = await purgeStaleConversations(NOW);
    expect(result).toEqual({ conversations: 2, messages: 3 });
    expect((await db.select().from(aiConversations)).map((c) => c.id)).toEqual([fresh.id]);
    expect(await db.select().from(aiMessages)).toHaveLength(2);
  });

  it('getConversation hides shared replies behind a placeholder when sharing is off', async () => {
    const c = await createConversation(a, 'x', 'm');
    await appendMessage(c.id, text('user', 'q'));
    await appendMessage(c.id, text('assistant', 'SHARED-ENQUIRY-REPLY'), { sharedEnquiryDetails: true });
    const off = await getConversation(a, c.id, { includeShared: false });
    expect(JSON.stringify(off)).not.toContain('SHARED-ENQUIRY-REPLY');
    expect(off.messages[1]!.parts).toEqual([{ type: 'text', text: HIDDEN_SHARED_REPLY }]);
    expect(off.messages[0]!.parts).toEqual([{ type: 'text', text: 'q' }]);
    const on = await getConversation(a, c.id, { includeShared: true });
    expect(on.messages[1]!.parts).toEqual([{ type: 'text', text: 'SHARED-ENQUIRY-REPLY' }]);
  });

  it('runAiRetention audits counts only, and nothing when nothing went', async () => {
    expect(await runAiRetention(NOW)).toEqual({ conversations: 0, messages: 0 });
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'ai.retention_purge'))).toHaveLength(0);
    const old = await createConversation(a, 'Secret title', 'm');
    await appendMessage(old.id, text('user', 'SECRET-TEXT'));
    await db.update(aiMessages).set({ createdAt: daysAgo(100) });
    await db.update(aiConversations).set({ updatedAt: daysAgo(100) });
    expect(await runAiRetention(NOW)).toEqual({ conversations: 1, messages: 1 });
    const [log] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'ai.retention_purge'));
    expect(log!.summary).toContain('1 AI assistant messages and 1 conversations');
    expect(JSON.stringify(log)).not.toMatch(/SECRET|Secret/);
  });

  it('deleteConversation writes ai.conversation_delete without the title', async () => {
    const c = await createConversation(a, 'Secret title', 'm');
    await deleteConversation({ userId: a }, c.id);
    const [log] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'ai.conversation_delete'));
    expect(log!.summary).toBe('Deleted an AI assistant conversation');
    expect(JSON.stringify(log)).not.toContain('Secret title');
  });

  it('titleFrom collapses whitespace and caps at 60', () => {
    expect(titleFrom('  a\n b  ')).toBe('a b');
    expect(titleFrom('x'.repeat(80)).length).toBeLessThanOrEqual(60);
  });
});
