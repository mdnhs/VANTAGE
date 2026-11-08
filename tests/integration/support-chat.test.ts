import nodemailer from 'nodemailer';
import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { resetMailerForTests } from '@/server/lib/email/mailer';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { supportRepository } from '@/server/repositories/support-repository';
import { supportService } from '@/server/services/support-service';

import { call, createTestUser, signInCookie } from '../support/session';

type Sent = { to: string[]; subject: string; text: string };

function recordMail(): Sent[] {
  vi.stubEnv('SMTP_HOST', 'smtp.example.com');
  vi.stubEnv('MAIL_FROM', 'Shop <no-reply@example.com>');
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const sent: Sent[] = [];
  vi.spyOn(transport, 'sendMail').mockImplementation((async (m: Record<string, unknown>) => {
    sent.push({ to: ([] as string[]).concat(m.to as never), subject: String(m.subject), text: String(m.text) });
    return { messageId: 'id-1' };
  }) as never);
  resetMailerForTests(transport);
  return sent;
}

const agent = async () => {
  const user = await createTestUser('support');
  return { ...user, cookie: await signInCookie(user.email) };
};
const owner = async () => {
  const user = await createTestUser('owner');
  return { ...user, cookie: await signInCookie(user.email) };
};

const chatPath = (id: string, rest = '') => `/admin/support/conversations/${id}${rest}`;
const post = (path: string, cookie: string, body?: unknown) => call(path, cookie, { method: 'POST', body });
const startChat = async (body = 'Hello') => (await supportService.start({ body })).conversation.id;

beforeEach(async () => {
  await db.execute(sql`truncate table settings, support_conversations cascade`);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetMailerForTests();
});

const count = async (table: 'support_conversations' | 'support_messages') => {
  const { rows } = await db.execute(sql.raw(`select count(*)::int as n from ${table}`));
  return (rows[0] as { n: number }).n;
};

describe('who can reach a chat', () => {
  const start = (body: string) => supportService.start({ body });
  const cookieFor = (token: string) => `support_chat=${token}`;

  it('shows a visitor only their own chat', async () => {
    const a = await start('From A');
    const b = await start('From B');

    const res = await call('/public/support/conversation', cookieFor(a.token));
    const { data } = await res.json();

    expect(data.id).toBe(a.conversation.id);
    expect(JSON.stringify(data)).not.toContain('From B');
    expect(b.conversation.id).not.toBe(a.conversation.id);
  });

  it('adds a message to the chat of the cookie and no other', async () => {
    const a = await start('From A');
    const b = await start('From B');

    await post('/public/support/messages', cookieFor(a.token), { body: 'More from A' });

    const detail = await (await call('/public/support/conversation', cookieFor(b.token))).json();
    expect(detail.data.messages.map((m: { body: string }) => m.body)).toEqual(['From B']);
  });

  it('treats a made-up token as no chat at all', async () => {
    await start('From A');
    const forged = cookieFor('not-a-real-token');

    expect((await (await call('/public/support/conversation', forged)).json()).data).toBeNull();
    expect((await post('/public/support/messages', forged, { body: 'Hi' })).status).toBe(401);
    expect((await call('/public/support/stream', forged)).status).toBe(401);
  });

  it('never gives a visitor the staff member full name or email', async () => {
    const [boss, sam] = [await owner(), await agent()];
    const a = await start('Hello');
    await post(chatPath(a.conversation.id, '/assign'), boss.cookie, { userId: sam.id });
    await post(chatPath(a.conversation.id, '/messages'), sam.cookie, { body: 'Hi there' });

    const text = await (await call('/public/support/conversation', cookieFor(a.token))).text();

    expect(text).not.toContain(sam.email);
    expect(text).not.toContain(sam.id);
    expect(text).not.toContain('Test support');
  });

  it('stores nothing for a bot that fills the hidden field', async () => {
    const res = await call('/public/support/conversations', undefined, {
      method: 'POST',
      body: { body: 'Buy now', website: 'http://spam.example' },
    });

    expect(res.status).toBe(201);
    expect(res.headers.getSetCookie()).toEqual([]);
    expect(await count('support_conversations')).toBe(0);
  });

  it('shows a support agent only the chats assigned to them', async () => {
    const [boss, sam] = [await owner(), await agent()];
    const mine = await startChat('Mine');
    const other = await startChat('Other');
    await post(chatPath(mine, '/assign'), boss.cookie, { userId: sam.id });

    const list = await (await call('/admin/support/conversations', sam.cookie)).json();

    expect(list.data.items.map((i: { id: string }) => i.id)).toEqual([mine]);
    expect((await call(chatPath(other), sam.cookie)).status).toBe(404);
    expect((await post(chatPath(other, '/messages'), sam.cookie, { body: 'Hi' })).status).toBe(404);
    expect((await post(chatPath(other, '/read'), sam.cookie)).status).toBe(404);
    expect((await post(chatPath(other, '/close'), sam.cookie)).status).toBe(404);
  });

  it('takes a chat away from the agent it was reassigned from', async () => {
    const [boss, sam, ana] = [await owner(), await agent(), await agent()];
    const id = await startChat();
    await post(chatPath(id, '/assign'), boss.cookie, { userId: sam.id });

    await post(chatPath(id, '/assign'), boss.cookie, { userId: ana.id });

    expect((await call(chatPath(id), sam.cookie)).status).toBe(404);
    expect((await call(chatPath(id), ana.cookie)).status).toBe(200);
  });

  it('only lets assign holders hand out chats', async () => {
    const sam = await agent();
    const id = await startChat();

    expect((await post(chatPath(id, '/assign'), sam.cookie, { userId: sam.id })).status).toBe(403);
  });

  it('refuses to assign someone who cannot answer chats', async () => {
    const boss = await owner();
    const editor = await createTestUser('editor');
    const id = await startChat();

    expect((await post(chatPath(id, '/assign'), boss.cookie, { userId: editor.id })).status).toBe(409);
  });
});

describe('a chat that has ended', () => {
  async function endedChat() {
    const boss = await owner();
    const { token, conversation } = await supportService.start({ body: 'Hello' });
    await post(chatPath(conversation.id, '/close'), boss.cookie);
    return { boss, token, id: conversation.id };
  }

  it('refuses a reply from staff and from the visitor', async () => {
    const { boss, token, id } = await endedChat();

    expect((await post(chatPath(id, '/messages'), boss.cookie, { body: 'Late' })).status).toBe(409);
    expect((await post('/public/support/messages', `support_chat=${token}`, { body: 'Late' })).status).toBe(409);
  });

  it('cannot gain a message even if a sender got past the status check', async () => {
    const { id } = await endedChat();
    const before = await count('support_messages');

    const written = await supportRepository.addMessage({ conversationId: id, sender: 'staff', body: 'Raced' });

    expect(written).toBeNull();
    expect(await count('support_messages')).toBe(before);
  });

  it('cannot be assigned even if an assigner got past the status check', async () => {
    const { boss, id } = await endedChat();

    expect((await supportRepository.assign(id, boss.id, null)).outcome).toBe('closed');
  });

  it('tells the visitor once however many times it is closed', async () => {
    const { boss, id } = await endedChat();

    await post(chatPath(id, '/close'), boss.cookie);

    const detail = await (await call(chatPath(id), boss.cookie)).json();
    expect(detail.data.messages.filter((m: { sender: string }) => m.sender === 'system')).toHaveLength(1);
  });
});

describe('unread for the agent holding a chat', () => {
  const unread = async (cookie: string) => (await (await call('/admin/support/unread', cookie)).json()).data.count;

  it('stays unread for the agent when an admin opens their chat', async () => {
    const [boss, sam] = [await owner(), await agent()];
    const id = await startChat();
    await post(chatPath(id, '/assign'), boss.cookie, { userId: sam.id });

    await post(chatPath(id, '/read'), boss.cookie);

    expect(await unread(sam.cookie)).toBe(1);
  });

  it('is cleared when the agent holding the chat opens it', async () => {
    const [boss, sam] = [await owner(), await agent()];
    const id = await startChat();
    await post(chatPath(id, '/assign'), boss.cookie, { userId: sam.id });

    await post(chatPath(id, '/read'), sam.cookie);

    expect(await unread(sam.cookie)).toBe(0);
  });

  it('is cleared by anyone who opens a chat nobody holds yet', async () => {
    const boss = await owner();
    const id = await startChat();

    await post(chatPath(id, '/read'), boss.cookie);

    expect(await unread(boss.cookie)).toBe(0);
  });

  it('comes back for the new agent after a reassignment', async () => {
    const [boss, sam, ana] = [await owner(), await agent(), await agent()];
    const id = await startChat();
    await post(chatPath(id, '/assign'), boss.cookie, { userId: sam.id });
    await post(chatPath(id, '/read'), sam.cookie);

    await post(chatPath(id, '/assign'), boss.cookie, { userId: ana.id });

    expect(await unread(ana.cookie)).toBe(1);
  });
});

describe('assigning at the same moment', () => {
  const systemNotices = async (id: string) => {
    const { rows } = await db.execute(
      sql`select body from support_messages where conversation_id = ${id} and sender = 'system' order by created_at`,
    );
    return (rows as { body: string }[]).map((r) => r.body);
  };

  it('ends with the last notice naming the person who holds the chat', async () => {
    const [sam, ana] = [await agent(), await agent()];
    const names = new Map([
      [sam.id, 'Sam joined the chat.'],
      [ana.id, 'Ana joined the chat.'],
    ]);
    for (let round = 0; round < 8; round++) {
      const id = await startChat();

      await Promise.all([...names].map(([userId, notice]) => supportRepository.assign(id, userId, notice)));

      const row = await supportRepository.byId(id);
      expect((await systemNotices(id)).at(-1)).toBe(names.get(row!.assignedTo!));
    }
  });

  it('posts one notice when both pick the same person', async () => {
    const sam = await agent();
    const id = await startChat();

    await Promise.all([
      supportRepository.assign(id, sam.id, 'Sam joined the chat.'),
      supportRepository.assign(id, sam.id, 'Sam joined the chat.'),
    ]);

    expect(await systemNotices(id)).toEqual(['Sam joined the chat.']);
  });

  it('reports who held the chat before', async () => {
    const [sam, ana] = [await agent(), await agent()];
    const id = await startChat();
    await supportRepository.assign(id, sam.id, null);

    const result = await supportRepository.assign(id, ana.id, null);

    expect(result).toEqual({ outcome: 'changed', previous: sam.id });
  });
});

describe('deleting a chat', () => {
  it('removes the chat and its messages and records who did it', async () => {
    const boss = await owner();
    const id = await startChat();

    const res = await call(chatPath(id), boss.cookie, { method: 'DELETE' });

    expect(res.status).toBe(200);
    expect(await count('support_conversations')).toBe(0);
    expect(await count('support_messages')).toBe(0);
    const { rows } = await db.execute(sql`select actor_id from audit_logs where action = 'support.delete'`);
    expect(rows).toEqual([{ actor_id: boss.id }]);
  });

  it('is refused to a support agent, even on their own chat', async () => {
    const [boss, sam] = [await owner(), await agent()];
    const id = await startChat();
    await post(chatPath(id, '/assign'), boss.cookie, { userId: sam.id });

    const res = await call(chatPath(id), sam.cookie, { method: 'DELETE' });

    expect(res.status).toBe(403);
    expect(await count('support_conversations')).toBe(1);
  });

  it('leaves the visitor with no chat', async () => {
    const boss = await owner();
    const { token, conversation } = await supportService.start({ body: 'Hello' });
    await call(chatPath(conversation.id), boss.cookie, { method: 'DELETE' });

    const res = await call('/public/support/conversation', `support_chat=${token}`);

    expect((await res.json()).data).toBeNull();
  });
});

describe('privacy requests', () => {
  const EMAIL = 'pat@example.com';
  const person = (path: 'export' | 'erase', cookie: string) =>
    post(`/admin/enquiries/privacy/${path}`, cookie, { email: EMAIL, ...(path === 'erase' ? { confirm: EMAIL } : {}) });

  async function chatWithEmail() {
    const { conversation } = await supportService.start({ body: 'Secret chat text' });
    const row = await supportService.byId(conversation.id);
    await supportService.visitorContact(row!, { email: 'PAT@example.com' });
    return conversation.id;
  }

  it('includes the chats given under that email in an export', async () => {
    const boss = await owner();
    const id = await chatWithEmail();

    const body = await (await person('export', boss.cookie)).json();

    expect(body.supportChats).toHaveLength(1);
    expect(body.supportChats[0].id).toBe(id);
    expect(body.supportChats[0].messages[0].body).toBe('Secret chat text');
    expect(body.supportChats[0].tokenHash).toBeUndefined();
  });

  it('erases chats given under that email', async () => {
    const boss = await owner();
    await chatWithEmail();

    const body = await (await person('erase', boss.cookie)).json();

    expect(body.data.deleted.supportChats).toBe(1);
    expect(await count('support_conversations')).toBe(0);
  });

  it('erases a chat where the visitor typed the address in a message', async () => {
    const boss = await owner();
    await startChat(`Reach me on ${EMAIL} please`);

    await person('erase', boss.cookie);

    expect(await count('support_conversations')).toBe(0);
  });

  it('leaves other people alone', async () => {
    const boss = await owner();
    await startChat('Nothing to do with that person');

    await person('erase', boss.cookie);

    expect(await count('support_conversations')).toBe(1);
  });
});

describe('no-reply alert', () => {
  const team = () =>
    settingsRepository.save('notifications', { version: 0, value: { recipients: ['team@example.com'] } }, null);

  it('tells the team once when a chat is left unanswered', async () => {
    await team();
    const sent = recordMail();
    const id = await startChat();

    await supportService.alertIfUnanswered(id);
    await supportService.alertIfUnanswered(id);

    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toEqual(['team@example.com']);
    expect(sent[0]!.text).toContain(`/dashboard/support?c=${id}`);
  });

  it('also tells the agent the chat is assigned to', async () => {
    await team();
    const [boss, sam] = [await owner(), await agent()];
    const id = await startChat();
    await post(chatPath(id, '/assign'), boss.cookie, { userId: sam.id });
    const sent = recordMail();

    await supportService.alertIfUnanswered(id);

    expect(sent[0]!.to.sort()).toEqual([sam.email, 'team@example.com'].sort());
  });

  it('stays quiet about a chat that has ended', async () => {
    await team();
    const boss = await owner();
    const id = await startChat();
    await post(chatPath(id, '/close'), boss.cookie);
    const sent = recordMail();

    await supportService.alertIfUnanswered(id);

    expect(sent).toHaveLength(0);
  });

  it('can alert again once staff have replied and the visitor is waiting again', async () => {
    await team();
    const boss = await owner();
    const { conversation } = await supportService.start({ body: 'First' });
    const sent = recordMail();
    await supportService.alertIfUnanswered(conversation.id);

    await post(chatPath(conversation.id, '/messages'), boss.cookie, { body: 'On it' });
    await supportService.alertIfUnanswered(conversation.id);

    expect(sent).toHaveLength(2);
  });
});
