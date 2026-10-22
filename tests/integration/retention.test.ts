import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, contactMessages, enquiryPhotos, media, quoteRequests } from '@/server/db/schema';
import { resetStorageForTests } from '@/server/lib/media/storage';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { mediaLibraryService } from '@/server/services/media-library-service';
import { runRetention } from '@/server/services/retention-service';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
}));

const UPLOAD_DIR = path.resolve('.test-uploads');

const NOW = new Date('2026-10-22T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const monthsAgo = (n: number) => {
  const d = new Date(NOW);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
};
const photo = (n: string) => `https://res.cloudinary.com/demo/image/upload/v1/vantage/quotes/${n}.jpg`;

const quote = (name: string, over: Record<string, unknown> = {}) => ({
  name,
  email: `${name}@example.com`,
  phone: '0871234567',
  ...over,
});
const contact = (name: string, over: Record<string, unknown> = {}) => ({
  firstName: name,
  lastName: 'T',
  email: `${name}@example.com`,
  phone: '0871234567',
  message: `PRIVATE-${name}`,
  ...over,
});
const old = { createdAt: monthsAgo(14), updatedAt: monthsAgo(13) };

const names = async () => ({
  q: (await db.select({ n: quoteRequests.name }).from(quoteRequests)).map((r) => r.n).sort(),
  c: (await db.select({ n: contactMessages.firstName }).from(contactMessages)).map((r) => r.n).sort(),
});

beforeEach(async () => {
  await db.execute(
    sql`truncate table settings, revisions, audit_logs, enquiry_photos, quote_requests, contact_messages, media cascade`,
  );
  // 12 months / 10 days so the windows are easy to read; defaults would be 24 / 30.
  await settingsRepository.save(
    'privacy',
    { version: 0, value: { enquiryRetentionMonths: 12, spamRetentionDays: 10 } },
    null,
  );
  await db.insert(quoteRequests).values([
    // survive: young
    quote('qfresh', { status: 'completed', createdAt: daysAgo(1), updatedAt: daysAgo(1) }),
    quote('qedge', { status: 'completed', createdAt: monthsAgo(12), updatedAt: monthsAgo(11) }),
    // survive: old but not finished
    quote('qnew', { status: 'new', ...old }),
    quote('qprogress', { status: 'in_progress', ...old }),
    quote('qsent', { status: 'quote_sent', ...old }),
    // survive: finished but carries invoice / payment data
    quote('qinvoiced', { status: 'completed', invoiceNumber: 'INV-1', ...old }),
    quote('qpaid', { status: 'completed', paymentStatus: 'paid_in_full', paidAmount: '500.00', ...old }),
    quote('qamount', { status: 'completed', paidAmount: '50.00', ...old }),
    quote('qmethod', { status: 'completed', paymentMethod: 'cash', ...old }),
    quote('qpartial', { status: 'archived', paymentStatus: 'partially_paid', ...old }),
    // deleted: finished, unbilled, old
    quote('qdone', { status: 'completed', photoUrls: [photo('a'), photo('b')], ...old }),
    quote('qcancel', { status: 'cancelled', ...old }),
    quote('qarch', { status: 'archived', ...old }),
    // spam
    quote('qspam', { status: 'spam', createdAt: daysAgo(40), updatedAt: daysAgo(20) }),
    quote('qspamnew', { status: 'spam', createdAt: daysAgo(40), updatedAt: daysAgo(1) }),
  ]);
  await db
    .insert(contactMessages)
    .values([
      contact('cfresh', { status: 'archived', createdAt: daysAgo(2), updatedAt: daysAgo(2) }),
      contact('cnew', { status: 'new', ...old }),
      contact('cread', { status: 'read', ...old }),
      contact('creplied', { status: 'replied', photoUrls: [photo('c')], ...old }),
      contact('carch', { status: 'archived', ...old }),
      contact('cspam', { status: 'spam', createdAt: daysAgo(40), updatedAt: daysAgo(15) }),
    ]);
});

const png = (color: string) =>
  sharp({ create: { width: 16, height: 16, channels: 3, background: color } })
    .png()
    .toBuffer();

// Real files in local storage. Returns the media row.
const enquiryMedia = async (color: string, createdAt?: Date) => {
  const row = await mediaLibraryService.ingest({
    bytes: await png(color),
    filename: 'enquiry-photo.png',
    actorId: null,
    scope: 'enquiry',
  });
  if (createdAt) await db.update(media).set({ createdAt }).where(eq(media.id, row.id));
  return row;
};
const linkTo = async (parent: { quoteRequestId: string } | { contactMessageId: string }, mediaId: string) =>
  db.insert(enquiryPhotos).values({ ...parent, mediaId, position: 0 });
const fileExists = (key: string) => existsSync(path.join(UPLOAD_DIR, key));

let seeded: {
  purgedQuote: Awaited<ReturnType<typeof enquiryMedia>>;
  purgedContact: Awaited<ReturnType<typeof enquiryMedia>>;
  keptQuote: Awaited<ReturnType<typeof enquiryMedia>>;
  oldOrphan: Awaited<ReturnType<typeof enquiryMedia>>;
  youngOrphan: Awaited<ReturnType<typeof enquiryMedia>>;
};

beforeAll(() => resetStorageForTests());
afterAll(() => rm(UPLOAD_DIR, { recursive: true, force: true }));

beforeEach(async () => {
  const idOf = async (n: string) => (await db.select().from(quoteRequests).where(eq(quoteRequests.name, n)))[0]!.id;
  const contactId = async (n: string) =>
    (await db.select().from(contactMessages).where(eq(contactMessages.firstName, n)))[0]!.id;
  seeded = {
    purgedQuote: await enquiryMedia('#a00'),
    purgedContact: await enquiryMedia('#0a0'),
    keptQuote: await enquiryMedia('#00a'),
    oldOrphan: await enquiryMedia('#aa0', new Date(NOW.getTime() - 25 * 3_600_000)),
    youngOrphan: await enquiryMedia('#0aa', new Date(NOW.getTime() - 23 * 3_600_000)),
  };
  await linkTo({ quoteRequestId: await idOf('qdone') }, seeded.purgedQuote.id);
  await linkTo({ contactMessageId: await contactId('creplied') }, seeded.purgedContact.id);
  await linkTo({ quoteRequestId: await idOf('qnew') }, seeded.keptQuote.id);
});

describe('runRetention', () => {
  it('dry run counts photos, legacy urls and orphans but deletes and audits nothing', async () => {
    const r = await runRetention({ dryRun: true, now: NOW });
    expect(r).toMatchObject({
      dryRun: true,
      windows: { enquiryRetentionMonths: 12, spamRetentionDays: 10 },
      quotes: { expired: 3, spam: 1 },
      contacts: { expired: 2, spam: 1 },
      photos: 2,
      legacyPhotos: 3,
      orphanPhotos: 1,
    });
    expect(await db.select().from(media)).toHaveLength(5);
    expect(fileExists(seeded.purgedQuote.key)).toBe(true);
    expect(fileExists(seeded.oldOrphan.key)).toBe(true);
    expect(await db.select().from(enquiryPhotos)).toHaveLength(3);
    expect((await names()).q).toHaveLength(15);
    expect((await names()).c).toHaveLength(6);
    expect(await db.select().from(auditLogs)).toHaveLength(0);
  });

  it('real run deletes exactly what the dry run counted, keeps open and billed rows', async () => {
    const dry = await runRetention({ dryRun: true, now: NOW });
    const r = await runRetention({ now: NOW });
    expect(r).toMatchObject({
      quotes: dry.quotes,
      contacts: dry.contacts,
      photos: dry.photos,
      legacyPhotos: dry.legacyPhotos,
      orphanPhotos: dry.orphanPhotos,
    });
    expect(await names()).toEqual({
      q: [
        'qedge',
        'qfresh',
        'qamount',
        'qinvoiced',
        'qmethod',
        'qnew',
        'qpaid',
        'qpartial',
        'qprogress',
        'qsent',
        'qspamnew',
      ].sort(),
      c: ['cfresh', 'cnew', 'cread'],
    });

    const audit = await db.select().from(auditLogs);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ action: 'privacy.retention', actorId: null });
    expect(JSON.stringify(audit[0])).not.toMatch(/PRIVATE|example\.com|cloudinary|qdone|cspam|enquiry-photo/);
  });

  it('hard-deletes purged enquiries media and old orphans, keeps linked and young media', async () => {
    await runRetention({ now: NOW });
    const left = (await db.select({ id: media.id }).from(media)).map((r) => r.id).sort();
    expect(left).toEqual([seeded.keptQuote.id, seeded.youngOrphan.id].sort());
    for (const gone of [seeded.purgedQuote, seeded.purgedContact, seeded.oldOrphan]) {
      expect(fileExists(gone.key)).toBe(false);
    }
    for (const kept of [seeded.keptQuote, seeded.youngOrphan]) expect(fileExists(kept.key)).toBe(true);
    expect(await db.select().from(enquiryPhotos)).toHaveLength(1);
  });

  it('never touches library media', async () => {
    const lib = await mediaLibraryService.ingest({
      bytes: await png('#555'),
      filename: 'lib.png',
      actorId: null,
      scope: 'library',
    });
    await db
      .update(media)
      .set({ createdAt: daysAgo(30) })
      .where(eq(media.id, lib.id));
    await runRetention({ now: NOW });
    expect(fileExists(lib.key)).toBe(true);
    expect(await db.select().from(media).where(eq(media.id, lib.id))).toHaveLength(1);
  });

  it('a media deletion failure never fails the purge', async () => {
    const r = await runRetention({
      now: NOW,
      deleteMedia: async () => {
        throw new Error('storage down');
      },
    });
    expect(r.quotes.expired).toBe(3);
  });

  it('a second run finds nothing and writes no audit row', async () => {
    await runRetention({ now: NOW });
    await db.execute(sql`truncate table audit_logs`);
    const r = await runRetention({ now: NOW });
    expect(r.quotes).toEqual({ expired: 0, spam: 0 });
    expect(r.contacts).toEqual({ expired: 0, spam: 0 });
    expect(await db.select().from(auditLogs)).toHaveLength(0);
  });

  it('uses the defaults (24 months / 30 days) when privacy was never saved', async () => {
    await db.execute(sql`truncate table settings`);
    const r = await runRetention({ dryRun: true, now: NOW });
    expect(r.windows).toEqual({ enquiryRetentionMonths: 24, spamRetentionDays: 30 });
    expect(r.quotes).toEqual({ expired: 0, spam: 0 });
    expect(r.contacts).toEqual({ expired: 0, spam: 0 });
  });

  it('archived is no longer treated as spam: a young archived row survives', async () => {
    const r = await runRetention({ dryRun: true, now: NOW });
    expect(r.contacts.spam).toBe(1); // only the status 'spam' row
  });
});
