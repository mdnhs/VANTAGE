import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { settings } from '@/server/db/schema';
import { supportRepository } from '@/server/repositories/support-repository';
import { settleNotifications } from '@/server/services/enquiry-notify';
import { supportService } from '@/server/services/support-service';

import { call, createTestUser, signInCookie } from '../support/session';

// The real bot service, repositories and database, with only the AI provider scripted
// (AI_PROVIDER_MOCK answers "OK" to everything).
const putSetting = (key: string, value: unknown) =>
  db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });

const bodies = async (id: string) => (await supportRepository.messages(id)).map((m) => `${m.sender}:${m.body}`);

beforeEach(async () => {
  vi.stubEnv('AI_PROVIDER_MOCK', 'true');
  await db.execute(sql`truncate table settings, support_conversations cascade`);
  await putSetting('supportBot', { enabled: true });
});
afterEach(() => vi.unstubAllEnvs());

describe('ai chat, end to end', () => {
  it('shows the visitor the assistant name whole, not cut to a first name', async () => {
    const { conversation, token } = await supportService.start({ body: 'Hello' });
    await settleNotifications();
    const row = (await supportService.byVisitorToken(token))!;
    const view = await supportService.visitorConversation(row);
    expect(view.messages.find((m) => m.sender === 'ai')?.senderName).toBe('AI assistant');
    expect(view.id).toBe(conversation.id);
  });

  it('answers twice-sent messages once while an answer is being written', async () => {
    const { conversation, token } = await supportService.start({ body: 'One' });
    const row = (await supportService.byVisitorToken(token))!;
    await supportService.visitorSend(row, 'Two');
    await settleNotifications();
    const all = await bodies(conversation.id);
    expect(all.filter((b) => b.startsWith('ai:'))).toHaveLength(1);
  });

  it('answers a new chat, then stops once a person takes over', async () => {
    const { conversation, token } = await supportService.start({ body: 'Do you fix dents?' });
    await settleNotifications();
    expect(await bodies(conversation.id)).toEqual(['visitor:Do you fix dents?', 'ai:OK']);
    const ai = (await supportRepository.messages(conversation.id)).at(-1)!;
    expect(ai.senderName).toBe('AI assistant');

    const boss = await createTestUser('owner');
    const cookie = await signInCookie(boss.email);
    await call(`/admin/support/conversations/${conversation.id}/ai`, cookie, { method: 'POST', body: { enabled: false } });

    const row = (await supportService.byVisitorToken(token))!;
    await supportService.visitorSend(row, 'And respraying?');
    await settleNotifications();
    const after = await bodies(conversation.id);
    expect(after.filter((b) => b.startsWith('ai:'))).toHaveLength(1);
    expect(after.at(-1)).toBe('visitor:And respraying?');
  });

  it('does not answer when the bot switch is off', async () => {
    await putSetting('supportBot', { enabled: false });
    const { conversation } = await supportService.start({ body: 'Hello' });
    await settleNotifications();
    expect(await bodies(conversation.id)).toEqual(['visitor:Hello']);
  });

  it('stops at the per-chat cap and asks for a person', async () => {
    await putSetting('supportBot', { enabled: true, maxAiReplies: 1 });
    const { conversation, token } = await supportService.start({ body: 'One' });
    await settleNotifications();
    const row = (await supportService.byVisitorToken(token))!;
    await supportService.visitorSend(row, 'Two');
    await settleNotifications();

    const all = await bodies(conversation.id);
    expect(all.filter((b) => b.startsWith('ai:'))).toHaveLength(1);
    expect(all.at(-1)).toBe('system:A team member will pick this up.');
    expect((await supportRepository.detail(conversation.id))?.needsHuman).toBe(true);
  });
});
