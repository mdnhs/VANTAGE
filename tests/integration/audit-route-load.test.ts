import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { quoteRequestRepository } from '@/server/repositories/quote-request-repository';

import { call, sessionCookie } from '../support/session';

type Body = { data: { id: string; adminNotes?: string | null; status?: string } };
const json = async (r: Response) => (await r.json()) as Body;
const quote = { name: 'Pat', email: 'pat@example.com', phone: '0871234567' };
const auditCount = async () => Number((await db.execute(sql`select count(*)::int as n from audit_logs`)).rows[0]!.n);

beforeEach(async () => {
  await db.execute(sql`truncate table quote_requests, audit_logs, users cascade`);
});
afterEach(() => {
  vi.restoreAllMocks();
});
afterAll(async () => {
  await db.execute(sql`truncate table quote_requests, audit_logs, users cascade`);
});

describe('auditRoute when the "before" load fails', () => {
  it('lets the change through, writes no audit row and logs once', async () => {
    const cookie = await sessionCookie('owner');
    const created = await json(await call('/quotes/admin', cookie, { method: 'POST', body: quote }));
    const id = created.data.id;
    const before = await auditCount();

    // Only the middleware's "before" load (the first call) fails; the handler's own re-read still works.
    vi.spyOn(quoteRequestRepository, 'byId').mockRejectedValueOnce(new Error('db down'));
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await call(`/quotes/${id}`, cookie, { method: 'PATCH', body: { status: 'contacted' } });
    expect(res.status).toBe(200);
    expect((await json(res)).data.status).toBe('contacted');
    expect(await auditCount()).toBe(before);
    expect(errors).toHaveBeenCalledTimes(1);
    expect(errors).toHaveBeenCalledWith('[audit-route] load failed', 'quote.update');
  });
});
