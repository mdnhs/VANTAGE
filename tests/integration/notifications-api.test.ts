import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import type { NotificationsDto } from '@/lib/notifications';
import { db } from '@/server/db';
import { contactMessages, quoteRequests, users } from '@/server/db/schema';
import { notify } from '@/server/lib/notifications/notify';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

const DAY = 86_400_000;

const get = async (cookie?: string) => {
  const res = await call('/admin/notifications', cookie);
  return { res, dto: res.status === 200 ? ((await res.json()).data as NotificationsDto) : null };
};
const post = (cookie: string) => call('/admin/notifications/seen', cookie, { method: 'POST' });

// A signed-in user created a day ago, so anything seeded "now" is unread.
async function userWith(role: string) {
  const u = await createTestUser(role);
  await db
    .update(users)
    .set({ createdAt: new Date(Date.now() - DAY) })
    .where(eq(users.id, u.id));
  return { ...u, cookie: await signInCookie(u.email) };
}

const addQuote = async (over: Partial<typeof quoteRequests.$inferInsert> = {}) => {
  const [row] = await db
    .insert(quoteRequests)
    .values({ name: 'Nora Byrne', email: 'nora.byrne@example.com', phone: '0871234567', ...over })
    .returning();
  return row!;
};
const addContact = async () => {
  const [row] = await db
    .insert(contactMessages)
    .values({
      firstName: 'Ann',
      lastName: 'Murphy',
      email: 'ann@example.com',
      phone: '0871234567',
      message: 'SECRET-MESSAGE',
    })
    .returning();
  return row!;
};

beforeEach(async () => {
  await db.execute(sql`truncate table audit_logs, quote_requests, contact_messages cascade`);
});

describe('GET /admin/notifications', () => {
  it('needs sign-in', async () => {
    expect((await get()).res.status).toBe(401);
  });

  it('filters every kind by the role permissions', async () => {
    const quote = await addQuote();
    await addContact();
    await notify('delivery_failed', { enquiry: 'quote', enquiryId: quote.id, channel: 'notification' });
    await notify('capi_failed', { status: 400 });
    const expected: Record<string, string[]> = {
      intake: ['contact', 'delivery_failed', 'quote'],
      marketer: ['capi_failed'],
      editor: [],
      viewer: [],
      author: [],
      owner: ['capi_failed', 'contact', 'delivery_failed', 'quote'],
      admin: ['capi_failed', 'contact', 'delivery_failed', 'quote'],
    };
    for (const [role, kinds] of Object.entries(expected)) {
      const u = await userWith(role);
      const { dto } = await get(u.cookie);
      expect(dto!.items.map((i) => i.kind).sort(), role).toEqual(kinds);
      expect(dto!.unread, role).toBe(kinds.length);
    }
  });

  it('hides spam and shows the first name only', async () => {
    await addQuote({ status: 'spam', name: 'Spammer Bot' });
    await addQuote({ description: 'SECRET-DAMAGE-TEXT' });
    const u = await userWith('intake');
    const { dto, res } = await get(u.cookie);
    expect(dto!.items).toHaveLength(1);
    expect(dto!.items[0]!.description).toBe('From Nora');
    const body = JSON.stringify(dto);
    for (const leak of ['Byrne', 'nora.byrne', 'SECRET-DAMAGE-TEXT', 'Spammer']) expect(body).not.toContain(leak);
    expect(res.status).toBe(200);
  });

  it('a new account sees items but none unread', async () => {
    await addQuote();
    const u = await createTestUser('intake');
    const { dto } = await get(await signInCookie(u.email));
    expect(dto!.items).toHaveLength(1);
    expect(dto!.unread).toBe(0);
  });

  it('caps at 20 newest within 30 days', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      name: `Q${i}`,
      email: 'a@example.com',
      phone: '1',
      createdAt: new Date(Date.now() - i * 1000),
    }));
    await db.insert(quoteRequests).values(rows);
    await addQuote({ name: 'Old', createdAt: new Date(Date.now() - 31 * DAY) });
    const u = await userWith('intake');
    const { dto } = await get(u.cookie);
    expect(dto!.items).toHaveLength(20);
    expect(dto!.unread).toBe(20);
    expect(dto!.items[0]!.description).toBe('From Q0');
    expect(dto!.items.some((i) => i.description === 'From Old')).toBe(false);
  });

  it('drops delivery failures whose enquiry was deleted', async () => {
    const quote = await addQuote();
    await notify('delivery_failed', { enquiry: 'quote', enquiryId: quote.id, channel: 'auto_reply' });
    await notify('delivery_failed', { enquiry: 'contact', enquiryId: randomUUID(), channel: 'notification' });
    const u = await userWith('owner');
    expect((await get(u.cookie)).dto!.items.filter((i) => i.kind === 'delivery_failed')).toHaveLength(1);
    await db.delete(quoteRequests).where(eq(quoteRequests.id, quote.id));
    expect((await get(u.cookie)).dto!.items.filter((i) => i.kind === 'delivery_failed')).toHaveLength(0);
  });

  it('links delivery failures to the enquiry', async () => {
    const quote = await addQuote();
    await notify('delivery_failed', { enquiry: 'quote', enquiryId: quote.id, channel: 'auto_reply' });
    const u = await userWith('intake');
    const item = (await get(u.cookie)).dto!.items.find((i) => i.kind === 'delivery_failed')!;
    expect(item.href).toBe(`/dashboard/quotes/${quote.id}`);
    expect(item.description).toBe('The auto-reply to the enquirer failed');
  });
});

describe('feed edge cases', () => {
  it('rejects the customer role', async () => {
    const u = await userWith('user');
    expect((await get(u.cookie)).res.status).toBe(403);
  });

  it('keeps the feed full when newer failures point at deleted enquiries', async () => {
    const live = await addQuote();
    await notify('delivery_failed', { enquiry: 'quote', enquiryId: live.id, channel: 'notification' });
    for (let i = 0; i < 55; i += 1) {
      await notify('delivery_failed', { enquiry: 'quote', enquiryId: randomUUID(), channel: 'notification' });
    }
    const u = await userWith('owner');
    const items = (await get(u.cookie)).dto!.items.filter((i) => i.kind === 'delivery_failed');
    expect(items).toHaveLength(1);
    expect(items[0]!.href).toBe(`/dashboard/quotes/${live.id}`);
  });

  it('does not treat a quote id as a live contact', async () => {
    const quote = await addQuote();
    await notify('delivery_failed', { enquiry: 'contact', enquiryId: quote.id, channel: 'notification' });
    const u = await userWith('owner');
    expect((await get(u.cookie)).dto!.items.filter((i) => i.kind === 'delivery_failed')).toHaveLength(0);
  });
});

describe('POST /admin/notifications/seen', () => {
  it('marks everything seen; later enquiries are unread again', async () => {
    await addQuote();
    const u = await userWith('intake');
    expect((await get(u.cookie)).dto!.unread).toBe(1);
    expect((await post(u.cookie)).status).toBe(200);
    expect((await get(u.cookie)).dto!.unread).toBe(0);
    await new Promise((r) => setTimeout(r, 20));
    await addQuote();
    expect((await get(u.cookie)).dto!.unread).toBe(1);
  });

  it('view-as shows the target feed but never marks it seen', async () => {
    await addQuote();
    const owner = await userWith('owner');
    const intake = await userWith('intake');
    const viewing = await viewAsCookie(owner.cookie, intake.id);
    expect((await get(viewing)).dto!.unread).toBe(1);
    const res = await post(viewing);
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('IMPERSONATION_READ_ONLY');
    expect((await get(await signInCookie(intake.email))).dto!.unread).toBe(1);
  });
});
