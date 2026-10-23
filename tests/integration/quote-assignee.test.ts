import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { quoteRequests, users } from '@/server/db/schema';

import { call, createTestUser, sessionCookie } from '../support/session';

type Body = {
  data: { id: string; assignedUserId: string | null };
  error: { code: string; causes?: Record<string, string[]> };
};
const json = async (r: Response) => (await r.json()) as Body;
const quote = { name: 'Pat', email: 'pat@example.com', phone: '0871234567' };

beforeEach(async () => {
  await db.execute(sql`truncate table quote_requests, audit_logs, users cascade`);
});
afterAll(async () => {
  await db.execute(sql`truncate table quote_requests, audit_logs, users cascade`);
});

describe('quote assignee validation', () => {
  async function setup() {
    const cookie = await sessionCookie('owner');
    const created = await json(await call('/quotes/admin', cookie, { method: 'POST', body: quote }));
    return { cookie, id: created.data.id };
  }
  const assign = (cookie: string, id: string, assignedUserId: string | null) =>
    call(`/quotes/${id}`, cookie, { method: 'PATCH', body: { assignedUserId } });
  const stored = async (id: string) =>
    (await db.select().from(quoteRequests).where(eq(quoteRequests.id, id)))[0]!.assignedUserId;

  it('accepts an active assignee with quote.update and allows unassigning', async () => {
    const { cookie, id } = await setup();
    const intake = await createTestUser('intake');
    expect((await assign(cookie, id, intake.id)).status).toBe(200);
    expect(await stored(id)).toBe(intake.id);
    expect((await assign(cookie, id, null)).status).toBe(200);
    expect(await stored(id)).toBeNull();
  });

  it.each([
    ['an unknown id', async () => 'no-such-user'],
    ['a customer', async () => (await createTestUser('user')).id],
    ['a viewer (no quote.update)', async () => (await createTestUser('viewer')).id],
    [
      'a banned user',
      async () => {
        const u = await createTestUser('intake');
        await db.update(users).set({ banned: true }).where(eq(users.id, u.id));
        return u.id;
      },
    ],
  ])('rejects %s with 422 and changes nothing', async (_label, makeId) => {
    const { cookie, id } = await setup();
    const res = await assign(cookie, id, await makeId());
    expect(res.status).toBe(422);
    const body = await json(res);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(body.error.causes!)).toEqual(['assignedUserId']);
    expect(await stored(id)).toBeNull();
  });

  it('applies to staff-entered enquiries too', async () => {
    const cookie = await sessionCookie('owner');
    const viewer = await createTestUser('viewer');
    const res = await call('/quotes/admin', cookie, { method: 'POST', body: { ...quote, assignedUserId: viewer.id } });
    expect(res.status).toBe(422);
  });
});
