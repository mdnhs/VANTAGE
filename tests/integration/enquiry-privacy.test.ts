import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, contactMessages, enquiryPhotos, media, quoteRequests } from '@/server/db/schema';
import { resetStorageForTests } from '@/server/lib/media/storage';
import { mediaLibraryService } from '@/server/services/media-library-service';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

const UPLOAD_DIR = path.resolve('.test-uploads');
const EMAIL = 'Person.Test@Example.com';
const path_ = (email = EMAIL) => `/admin/enquiries/privacy?email=${encodeURIComponent(email)}`;

let owner: string;
let photo: { id: string; key: string };
let unpaidId: string;
let paidId: string;
let otherId: string;

beforeAll(() => resetStorageForTests());
afterAll(() => rm(UPLOAD_DIR, { recursive: true, force: true }));

beforeEach(async () => {
  await db.execute(sql`truncate table audit_logs, enquiry_photos, quote_requests, contact_messages, media cascade`);
  owner = await signInCookie((await createTestUser('owner')).email);
  const [unpaid, paid, other] = await db
    .insert(quoteRequests)
    .values([
      { name: 'Person One', email: EMAIL.toLowerCase(), phone: '1' },
      {
        name: 'Person Two',
        email: EMAIL.toUpperCase(),
        phone: '1',
        invoiceNumber: 'INV-9',
        paymentStatus: 'paid_in_full',
      },
      { name: 'Someone Else', email: 'else@example.com', phone: '1' },
    ])
    .returning();
  unpaidId = unpaid!.id;
  paidId = paid!.id;
  otherId = other!.id;
  await db
    .insert(contactMessages)
    .values({ firstName: 'Person', lastName: 'C', email: EMAIL, phone: '1', message: 'PRIVATE-MESSAGE' });
  const row = await mediaLibraryService.ingest({
    bytes: await sharp({ create: { width: 8, height: 8, channels: 3, background: '#a00' } })
      .png()
      .toBuffer(),
    filename: 'enquiry-photo.png',
    actorId: null,
    scope: 'enquiry',
  });
  photo = { id: row.id, key: row.key };
  await db.insert(enquiryPhotos).values({ quoteRequestId: unpaidId, mediaId: row.id, position: 0 });
});

describe('GET /admin/enquiries/privacy', () => {
  it('lists quotes and contacts case-insensitively as a JSON download', async () => {
    const res = await call(path_(), owner);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename="privacy-\d{4}-\d{2}-\d{2}\.json"$/);
    const data = await res.json();
    expect(data.email).toBe(EMAIL.toLowerCase());
    expect(data.quotes).toHaveLength(2);
    expect(data.contacts).toHaveLength(1);
    expect(data.quotes.find((q: { id: string }) => q.id === unpaidId).photos).toHaveLength(1);
    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'privacy.export'));
    expect(row).toMatchObject({ entityType: 'person' });
    expect(row!.entityId).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row).toLowerCase()).not.toContain('example.com');
  });

  it('refuses roles without export rights', async () => {
    const marketer = await signInCookie((await createTestUser('marketer')).email);
    expect((await call(path_(), marketer)).status).toBe(403);
    const intake = await signInCookie((await createTestUser('intake')).email);
    expect((await call(path_(), intake)).status).toBe(403);
  });

  it('rejects a malformed email', async () => {
    expect((await call(path_('not-an-email'), owner)).status).toBe(422);
  });
});

describe('DELETE /admin/enquiries/privacy', () => {
  it('erases the contact, the unpaid quote and its photo, and keeps the paid quote', async () => {
    const res = await call(path_(), owner, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({
      deleted: { quotes: 1, contacts: 1 },
      kept: [{ id: paidId, reason: 'billing' }],
    });
    const left = (await db.select({ id: quoteRequests.id }).from(quoteRequests)).map((r) => r.id).sort();
    expect(left).toEqual([paidId, otherId].sort());
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(await db.select().from(media).where(eq(media.id, photo.id))).toHaveLength(0);
    expect(existsSync(path.join(UPLOAD_DIR, photo.key))).toBe(false);

    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'privacy.erase'));
    expect(row!.summary).toBe(
      'Privacy erase: 1 quotes and 1 contact messages deleted, 1 quotes kept (invoice or payment records)',
    );
    expect(JSON.stringify(row).toLowerCase()).not.toContain('example.com');
    expect(JSON.stringify(row)).not.toContain('PRIVATE');
  });

  it('is refused during View-as and by roles without delete rights', async () => {
    const admin = await createTestUser('admin');
    const viewing = await viewAsCookie(owner, admin.id);
    const res = await call(path_(), viewing, { method: 'DELETE' });
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('IMPERSONATION_READ_ONLY');
    const intake = await signInCookie((await createTestUser('intake')).email);
    expect((await call(path_(), intake, { method: 'DELETE' })).status).toBe(403);
    expect(await db.select().from(quoteRequests)).toHaveLength(3);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'privacy.erase'))).toHaveLength(0);
  });
});
