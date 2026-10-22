import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { api } from '@/server/api';
import { db } from '@/server/db';
import { quoteRequests } from '@/server/db/schema';

import { sessionCookie } from '../support/session';

const post = (path: string, body: unknown, cookie?: string) =>
  api.request(`/api/v1${path}`, {
    method: 'POST',
    headers: { origin: 'http://localhost:3000', 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });

const base = { name: 'Pat', email: 'pat@example.com', phone: '0871234567' };

describe('public quote form', () => {
  beforeEach(async () => {
    await db.execute(sql`truncate table enquiry_photos, quote_requests`);
  });

  it('ignores admin-only fields sent by an anonymous caller', async () => {
    const res = await post('/quotes', {
      ...base,
      status: 'completed',
      assignedUserId: 'someone',
      paymentStatus: 'paid_in_full',
      paidAmount: 999,
      invoiceNumber: 'INV-1',
      estimatedCost: 1,
      adminNotes: 'hacked',
    });
    expect(res.status).toBe(201);
    const [row] = await db.select().from(quoteRequests);
    expect(row).toMatchObject({
      status: 'new',
      assignedUserId: null,
      paymentStatus: 'unpaid',
      invoiceNumber: null,
      adminNotes: null,
    });
    expect(row!.estimatedCost).toBeNull();
  });

  it('POST /quotes/admin needs quote[update]', async () => {
    expect((await post('/quotes/admin', base)).status).toBe(401);
    expect((await post('/quotes/admin', base, await sessionCookie('marketer'))).status).toBe(403);
    expect((await post('/quotes/admin', base, await sessionCookie('user'))).status).toBe(403);
    const res = await post('/quotes/admin', { ...base, status: 'contacted' }, await sessionCookie('intake'));
    expect(res.status).toBe(201);
    const [row] = await db.select().from(quoteRequests);
    expect(row!.status).toBe('contacted');
  });
});

describe('public contact form', () => {
  it('ignores admin-only fields', async () => {
    await db.execute(sql`truncate table enquiry_photos, contact_messages`);
    const res = await post('/contacts', {
      firstName: 'Pat',
      lastName: 'Q',
      email: 'pat@example.com',
      phone: '0871234567',
      message: 'hi',
      status: 'archived',
      adminNotes: 'x',
    });
    expect(res.status).toBe(201);
    const { data } = (await res.json()) as { data: { status: string; adminNotes: string | null } };
    expect(data.status).toBe('new');
    expect(data.adminNotes ?? null).toBeNull();
  });
});
