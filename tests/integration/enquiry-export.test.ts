import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { exportLimits } from '@/server/services/enquiry-export-service';
import { auditLogs, contactMessages, quoteRequests } from '@/server/db/schema';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

let owner: string;

const csv = '/admin/enquiries/export.csv';
const audits = (action: string) => db.select().from(auditLogs).where(eq(auditLogs.action, action));

beforeEach(async () => {
  await db.execute(sql`truncate table audit_logs, enquiry_photos, quote_requests, contact_messages cascade`);
  owner = await signInCookie((await createTestUser('owner')).email);
  await db.insert(quoteRequests).values([
    { name: 'Pat Murphy', email: 'pat@example.com', phone: '0871234567', description: '=HYPERLINK("x")' },
    { name: 'Ann Byrne', email: 'ann@example.com', phone: '0871234568' },
    { name: 'Spammer', email: 'spam@example.com', phone: '0', status: 'spam' },
  ]);
  await db.insert(contactMessages).values([
    { firstName: 'Con', lastName: 'Tact', email: 'c@example.com', phone: '1', message: 'hello' },
    { firstName: 'Junk', lastName: 'Mail', email: 'j@example.com', phone: '1', message: 'buy', status: 'spam' },
  ]);
});

describe('GET /admin/enquiries/export.csv', () => {
  it('exports quotes without spam, protects formulas and audits the count only', async () => {
    const res = await call(`${csv}?type=quotes`, owner);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename="quotes-\d{4}-\d{2}-\d{2}\.csv"$/);
    const bytes = new Uint8Array(await res.arrayBuffer());
    // UTF-8 byte order mark (text decoding would strip it).
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes).slice(1);
    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('Name');
    expect(text).toContain('Pat Murphy');
    expect(text).not.toContain('Spammer');
    expect(text).toContain(`'=HYPERLINK`);
    const [row] = await audits('quote.export');
    expect(row).toMatchObject({ entityType: 'quote', summary: 'Exported 2 rows' });
    expect(JSON.stringify(row)).not.toContain('example.com');
  });

  it('exports only spam when asked for the spam folder', async () => {
    const text = await (await call(`${csv}?type=quotes&status=spam`, owner)).text();
    expect(text).toContain('Spammer');
    expect(text).not.toContain('Pat Murphy');
  });

  it('exports contacts under contact.export', async () => {
    const res = await call(`${csv}?type=contacts`, owner);
    const text = await res.text();
    expect(text).toContain('Con');
    expect(text).not.toContain('Junk');
    expect(res.headers.get('content-disposition')).toContain('contacts-');
    expect(await audits('contact.export')).toHaveLength(1);
  });

  it('refuses a role without export rights and anonymous callers', async () => {
    const intake = await signInCookie((await createTestUser('intake')).email);
    expect((await call(`${csv}?type=quotes`, intake)).status).toBe(403);
    expect((await call(`${csv}?type=quotes`)).status).toBe(401);
    expect(await audits('quote.export')).toHaveLength(0);
  });

  it('rejects an unknown type', async () => {
    expect((await call(`${csv}?type=other`, owner)).status).toBe(422);
  });

  it('stops at the cap, says so in a header and keeps the file clean', async () => {
    await db.insert(contactMessages).values(
      [2, 3].map((n) => ({
        firstName: `Extra${n}`,
        lastName: 'T',
        email: `e${n}@example.com`,
        phone: '1',
        message: 'm',
      })),
    );
    const before = exportLimits.rows;
    exportLimits.rows = 2;
    try {
      const res = await call(`${csv}?type=contacts`, owner, { headers: { 'x-forwarded-for': '203.0.113.9' } });
      expect(res.headers.get('x-export-capped')).toBe('2');
      expect(res.headers.get('content-disposition')).toContain('contacts-');
      expect((await res.text()).trim().split('\n')).toHaveLength(3);
      const rows = await audits('contact.export');
      expect(rows[0]!.summary).toBe('Exported 2 rows (capped at 2)');
      // Exactly at the cap is not capped.
      const small = await call(`${csv}?type=quotes`, owner, { headers: { 'x-forwarded-for': '203.0.113.9' } });
      expect(small.headers.get('x-export-capped')).toBeNull();
    } finally {
      exportLimits.rows = before;
    }
    const full = await call(`${csv}?type=contacts`, owner, { headers: { 'x-forwarded-for': '203.0.113.9' } });
    expect(full.headers.get('x-export-capped')).toBeNull();
  });

  it('is refused during View-as', async () => {
    const admin = await createTestUser('admin');
    const viewing = await viewAsCookie(owner, admin.id);
    expect((await call(`${csv}?type=quotes`, viewing)).status).toBe(403);
  });

  it('answers 429 on the 11th call in a minute', async () => {
    // A fresh client address so the earlier calls in this file do not count.
    const headers = { 'x-forwarded-for': '203.0.113.7' };
    for (let i = 0; i < 10; i++) expect((await call(`${csv}?type=quotes`, owner, { headers })).status).toBe(200);
    expect((await call(`${csv}?type=quotes`, owner, { headers })).status).toBe(429);
  });
});
