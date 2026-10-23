import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import {
  aiConversations,
  aiMessages,
  auditLogs,
  contactMessages,
  enquiryPhotos,
  media,
  quoteRequests,
} from '@/server/db/schema';
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
const EXPORT = '/admin/enquiries/privacy/export';
const ERASE = '/admin/enquiries/privacy/erase';
const post = (url: string, cookie: string, email = EMAIL) => call(url, cookie, { method: 'POST', body: { email } });

let owner: string;
let photo: { id: string; key: string };
let paidPhoto: { id: string; key: string };
let contactPhoto: { id: string; key: string };
let contactId: string;
let unpaidId: string;
let paidId: string;
let otherId: string;

beforeAll(() => resetStorageForTests());
afterAll(() => rm(UPLOAD_DIR, { recursive: true, force: true }));

beforeEach(async () => {
  await db.execute(
    sql`truncate table audit_logs, ai_conversations, enquiry_photos, quote_requests, contact_messages, media cascade`,
  );
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
  const [contact] = await db
    .insert(contactMessages)
    .values({ firstName: 'Person', lastName: 'C', email: `  ${EMAIL} `, phone: '1', message: 'PRIVATE-MESSAGE' })
    .returning();
  contactId = contact!.id;
  const ingest = async (color: string) => {
    const row = await mediaLibraryService.ingest({
      bytes: await sharp({ create: { width: 8, height: 8, channels: 3, background: color } })
        .png()
        .toBuffer(),
      filename: 'enquiry-photo.png',
      actorId: null,
      scope: 'enquiry',
    });
    return { id: row.id, key: row.key };
  };
  photo = await ingest('#a00');
  paidPhoto = await ingest('#0a0');
  contactPhoto = await ingest('#00a');
  await db.insert(enquiryPhotos).values([
    { quoteRequestId: unpaidId, mediaId: photo.id, position: 0 },
    { quoteRequestId: paidId, mediaId: paidPhoto.id, position: 0 },
    { contactMessageId: contactId, mediaId: contactPhoto.id, position: 0 },
  ]);
  // Saved assistant replies: one quotes the address (any case), one does not.
  const staff = await createTestUser('owner');
  const [conv] = await db.insert(aiConversations).values({ userId: staff.id, title: 't', model: 'm' }).returning();
  await db.insert(aiMessages).values([
    {
      conversationId: conv!.id,
      role: 'assistant',
      parts: [{ type: 'text', text: `Reach ${EMAIL.toUpperCase()} today` }],
    },
    { conversationId: conv!.id, role: 'assistant', parts: [{ type: 'text', text: 'Nothing personal here' }] },
  ]);
});

describe('POST /admin/enquiries/privacy/export', () => {
  it('lists quotes and contacts case-insensitively as a JSON download', async () => {
    const res = await post(EXPORT, owner);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename="privacy-\d{4}-\d{2}-\d{2}\.json"$/);
    const data = await res.json();
    expect(data.email).toBe(EMAIL.toLowerCase());
    expect(data.quotes).toHaveLength(2);
    expect(data.contacts).toHaveLength(1);
    expect(data.aiMessages).toHaveLength(1);
    expect(data.quotes.find((q: { id: string }) => q.id === unpaidId).photos).toHaveLength(1);
    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'privacy.export'));
    expect(row).toMatchObject({ entityType: 'person' });
    expect(row!.entityId).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row).toLowerCase()).not.toContain('example.com');
  });

  it('refuses roles without export rights', async () => {
    const marketer = await signInCookie((await createTestUser('marketer')).email);
    expect((await post(EXPORT, marketer)).status).toBe(403);
    const intake = await signInCookie((await createTestUser('intake')).email);
    expect((await post(EXPORT, intake)).status).toBe(403);
  });

  it('rejects a malformed email', async () => {
    expect((await post(EXPORT, owner, 'not-an-email')).status).toBe(422);
  });
});

describe('POST /admin/enquiries/privacy/erase', () => {
  it('erases the contact, the unpaid quote and its photo, and keeps the paid quote', async () => {
    const res = await post(ERASE, owner);
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({
      deleted: { quotes: 1, contacts: 1, aiMessages: 1 },
      kept: [{ id: paidId, reason: 'billing' }],
    });
    const left = (await db.select({ id: quoteRequests.id }).from(quoteRequests)).map((r) => r.id).sort();
    expect(left).toEqual([paidId, otherId].sort());
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(await db.select().from(media).where(eq(media.id, photo.id))).toHaveLength(0);
    expect(existsSync(path.join(UPLOAD_DIR, photo.key))).toBe(false);
    // The contact's photo goes with it; the kept paid quote keeps its own.
    expect(existsSync(path.join(UPLOAD_DIR, contactPhoto.key))).toBe(false);
    expect(await db.select().from(media).where(eq(media.id, contactPhoto.id))).toHaveLength(0);
    expect(existsSync(path.join(UPLOAD_DIR, paidPhoto.key))).toBe(true);
    expect(await db.select().from(enquiryPhotos).where(eq(enquiryPhotos.quoteRequestId, paidId))).toHaveLength(1);
    // Only the reply quoting the address is erased.
    expect(await db.select().from(aiMessages)).toHaveLength(1);

    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'privacy.erase'));
    expect(row!.summary).toBe(
      'Privacy erase: 1 quotes and 1 contact messages and 1 AI messages deleted, 1 quotes kept (invoice or payment records)',
    );
    expect(JSON.stringify(row).toLowerCase()).not.toContain('example.com');
    expect(JSON.stringify(row)).not.toContain('PRIVATE');
  });

  it('does not accept the address in a URL', async () => {
    const res = await call(`/admin/enquiries/privacy?email=${encodeURIComponent(EMAIL)}`, owner, { method: 'DELETE' });
    expect(res.status).toBe(404);
    expect(await db.select().from(contactMessages)).toHaveLength(1);
  });

  it('is refused during View-as and by roles without delete rights', async () => {
    const admin = await createTestUser('admin');
    const viewing = await viewAsCookie(owner, admin.id);
    const res = await post(ERASE, viewing);
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('IMPERSONATION_READ_ONLY');
    expect((await post(EXPORT, viewing)).status).toBe(403);
    const intake = await signInCookie((await createTestUser('intake')).email);
    expect((await post(ERASE, intake)).status).toBe(403);
    expect(await db.select().from(quoteRequests)).toHaveLength(3);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'privacy.erase'))).toHaveLength(0);
  });
});
