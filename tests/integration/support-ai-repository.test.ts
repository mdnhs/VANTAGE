import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { supportRepository } from '@/server/repositories/support-repository';
import { supportService } from '@/server/services/support-service';

const startChat = async (body = 'Hello') => (await supportService.start({ body })).conversation.id;

beforeEach(async () => {
  await db.execute(sql`truncate table support_conversations cascade`);
});

describe('support ai flags', () => {
  it('stores an ai message while ai is on and drops it once ai is off', async () => {
    const id = await startChat();
    const first = await supportRepository.addMessage({
      conversationId: id,
      sender: 'ai',
      body: 'Hi there',
      senderName: 'AI assistant',
      requireAiEnabled: true,
    });
    expect(first?.sender).toBe('ai');

    await supportRepository.setAi(id, false);
    const second = await supportRepository.addMessage({
      conversationId: id,
      sender: 'ai',
      body: 'Late answer',
      requireAiEnabled: true,
    });
    expect(second).toBeNull();
  });

  it('flags needs-human once, on the first call only', async () => {
    const id = await startChat();
    expect(await supportRepository.flagNeedsHuman(id)).toBe(true);
    expect(await supportRepository.flagNeedsHuman(id)).toBe(false);
  });

  it('clears needs-human when ai is turned off', async () => {
    const id = await startChat();
    await supportRepository.flagNeedsHuman(id);
    const result = await supportRepository.setAi(id, false);
    expect(result?.changed).toBe(true);
    expect((await supportRepository.detail(id))?.needsHuman).toBe(false);
  });

  it('does not flag a chat a person has taken from the AI', async () => {
    const id = await startChat();
    await supportRepository.setAi(id, false);
    expect(await supportRepository.flagNeedsHuman(id)).toBe(false);
  });

  it('clears needs-human when the AI is handed the chat back', async () => {
    const id = await startChat();
    await supportRepository.flagNeedsHuman(id);
    await supportRepository.setAi(id, false);
    await supportRepository.setAi(id, true);
    expect((await supportRepository.detail(id))?.needsHuman).toBe(false);
  });

  it('refuses to change ai on a closed chat', async () => {
    const id = await startChat();
    await supportRepository.close(id);
    expect(await supportRepository.setAi(id, false)).toBeNull();
  });

  it('returns recent history oldest first, without system notices, up to the limit', async () => {
    const id = await startChat('one');
    await supportRepository.addMessage({ conversationId: id, sender: 'system', body: 'joined' });
    await supportRepository.addMessage({ conversationId: id, sender: 'ai', body: 'two' });
    await supportRepository.addMessage({ conversationId: id, sender: 'visitor', body: 'three' });

    const all = await supportRepository.recentForModel(id, 20);
    expect(all.map((m) => m.body)).toEqual(['one', 'two', 'three']);

    const last = await supportRepository.recentForModel(id, 2);
    expect(last.map((m) => m.body)).toEqual(['two', 'three']);
  });

  it('counts ai replies in a chat', async () => {
    const id = await startChat();
    await supportRepository.addMessage({ conversationId: id, sender: 'ai', body: 'a' });
    await supportRepository.addMessage({ conversationId: id, sender: 'ai', body: 'b' });
    expect(await supportRepository.aiReplyCount(id)).toBe(2);
  });
});
