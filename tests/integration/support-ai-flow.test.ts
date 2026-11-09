import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const bot = vi.hoisted(() => ({ active: true, maybeReply: vi.fn(), isActive: vi.fn() }));
vi.mock('@/server/services/support-bot-service', () => ({
  supportBotService: { isActive: bot.isActive, isActiveCached: bot.isActive, maybeReply: bot.maybeReply },
}));

import { db } from '@/server/db';
import { supportRepository } from '@/server/repositories/support-repository';
import { settleNotifications } from '@/server/services/enquiry-notify';
import { supportService } from '@/server/services/support-service';

import { call, createTestUser, signInCookie } from '../support/session';

const agent = async () => {
  const user = await createTestUser('support');
  return { ...user, cookie: await signInCookie(user.email) };
};
const owner = async () => {
  const user = await createTestUser('owner');
  return { ...user, cookie: await signInCookie(user.email) };
};
const post = (path: string, cookie: string, body?: unknown) => call(path, cookie, { method: 'POST', body });
const chatPath = (id: string, rest = '') => `/admin/support/conversations/${id}${rest}`;
const detail = async (id: string) => (await supportRepository.detail(id))!;

beforeEach(async () => {
  await db.execute(sql`truncate table settings, support_conversations cascade`);
  bot.active = true;
  bot.maybeReply.mockReset().mockResolvedValue('replied');
  bot.isActive.mockReset().mockImplementation(async () => bot.active);
});

describe('the ai answers new chats', () => {
  it('asks the bot to reply once to a new chat and to every later visitor message', async () => {
    const { conversation, token } = await supportService.start({ body: 'Hello' });
    await settleNotifications();
    expect(bot.maybeReply).toHaveBeenCalledTimes(1);
    expect(bot.maybeReply).toHaveBeenCalledWith(conversation.id);

    const row = (await supportService.byVisitorToken(token))!;
    await supportService.visitorSend(row, 'More');
    await settleNotifications();
    expect(bot.maybeReply).toHaveBeenCalledTimes(2);
  });

  it('leaves the chat to people when the bot is off', async () => {
    bot.active = false;
    const { conversation } = await supportService.start({ body: 'Hello' });
    await settleNotifications();
    expect(bot.maybeReply).not.toHaveBeenCalled();
    expect(conversation.aiActive).toBe(false);
  });

  it('tells the widget the ai is active only while it is on, unassigned and the bot is on', async () => {
    const { conversation, token } = await supportService.start({ body: 'Hello' });
    expect(conversation.aiActive).toBe(true);

    const boss = await owner();
    await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: false });
    const row = (await supportService.byVisitorToken(token))!;
    expect((await supportService.visitorConversation(row)).aiActive).toBe(false);
  });
});

describe('a person takes over', () => {
  it('turns the ai off when staff reply, so a reply still being written is dropped', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    const sam = await agent();
    await post(chatPath(conversation.id, '/assign'), (await owner()).cookie, { userId: sam.id });
    await post(chatPath(conversation.id, '/messages'), sam.cookie, { body: 'Hi, Sam here' });

    expect((await detail(conversation.id)).aiEnabled).toBe(false);
    const late = await supportRepository.addMessage({
      conversationId: conversation.id,
      sender: 'ai',
      body: 'Late AI answer',
      requireAiEnabled: true,
    });
    expect(late).toBeNull();
  });

  it('turns the ai off when someone replies to an unassigned chat', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    const boss = await owner();
    await post(chatPath(conversation.id, '/messages'), boss.cookie, { body: 'Hello from the owner' });
    const row = await detail(conversation.id);
    expect(row.aiEnabled).toBe(false);
    expect(row.assignedTo).toBe(boss.id);
  });

  it('turns the ai off when the chat is assigned to a person', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    const sam = await agent();
    await post(chatPath(conversation.id, '/assign'), (await owner()).cookie, { userId: sam.id });
    expect((await detail(conversation.id)).aiEnabled).toBe(false);
  });

  it('"take over" assigns the person, turns the ai off and says they joined', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    // Only people who can assign see an unassigned chat; a support agent sees chats given to them.
    const boss = await owner();
    const res = await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: false });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ aiEnabled: false });

    const row = await detail(conversation.id);
    expect(row.aiEnabled).toBe(false);
    expect(row.assignedTo).toBe(boss.id);
    const messages = await supportRepository.messages(conversation.id);
    expect(messages.at(-1)).toMatchObject({ sender: 'system' });
    expect(messages.at(-1)!.body).toContain('joined the chat');
  });

  it('clears "needs a person" once someone takes over', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    await supportRepository.flagNeedsHuman(conversation.id);
    await post(chatPath(conversation.id, '/ai'), (await owner()).cookie, { enabled: false });
    expect((await detail(conversation.id)).needsHuman).toBe(false);
  });
});

describe('handing the chat back to the ai', () => {
  it('turns the ai on for the person who holds the chat, and asks it to answer a waiting visitor', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    await settleNotifications();
    bot.maybeReply.mockClear();
    const boss = await owner();
    await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: false });
    // handing back also releases the chat, so the ai may answer it again
    const res = await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: true });
    expect(res.status).toBe(200);
    const row = await detail(conversation.id);
    expect(row.aiEnabled).toBe(true);
    expect(row.assignedTo).toBeNull();
    const last = (await supportRepository.messages(conversation.id)).at(-1)!;
    expect(last.body).toBe('AI assistant is back on this chat.');
    await settleNotifications();
    expect(bot.maybeReply).toHaveBeenCalledWith(conversation.id);
  });

  it('refuses to hand back while the AI assistant is switched off, leaving the chat with the person', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    const boss = await owner();
    await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: false });
    bot.active = false;
    const res = await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: true });
    expect(res.status).toBe(409);
    const row = await detail(conversation.id);
    expect(row.aiEnabled).toBe(false);
    expect(row.assignedTo).toBe(boss.id);
  });

  it('posts the "back" notice once, even when handed back twice', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    const boss = await owner();
    await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: false });
    await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: true });
    await post(chatPath(conversation.id, '/ai'), boss.cookie, { enabled: true });
    const notices = (await supportRepository.messages(conversation.id)).filter((m) => m.body.includes('is back'));
    expect(notices).toHaveLength(1);
  });

  it('refuses when the chat is held by someone else', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    const [sam, ana] = [await agent(), await agent()];
    await post(chatPath(conversation.id, '/assign'), (await owner()).cookie, { userId: sam.id });
    const res = await post(chatPath(conversation.id, '/ai'), ana.cookie, { enabled: true });
    expect([404, 409]).toContain(res.status);
    expect((await detail(conversation.id)).aiEnabled).toBe(false);
  });

  it('is refused on a closed chat', async () => {
    const { conversation } = await supportService.start({ body: 'Hello' });
    const sam = await agent();
    await post(chatPath(conversation.id, '/close'), (await owner()).cookie);
    const res = await post(chatPath(conversation.id, '/ai'), sam.cookie, { enabled: false });
    expect([404, 409]).toContain(res.status);
  });
});
