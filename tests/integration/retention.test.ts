import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, contactMessages, quoteRequests } from '@/server/db/schema';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { cloudinaryPublicId, runRetention } from '@/server/services/retention-service';

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
    sql`truncate table settings, revisions, audit_logs, enquiry_photos, quote_requests, contact_messages`,
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

describe('runRetention', () => {
  it('dry run counts (including photos) but deletes and audits nothing', async () => {
    const r = await runRetention({ dryRun: true, now: NOW });
    expect(r).toMatchObject({
      dryRun: true,
      windows: { enquiryRetentionMonths: 12, spamRetentionDays: 10 },
      quotes: { expired: 3, spam: 1 },
      contacts: { expired: 2, spam: 1 },
      photos: 3,
    });
    expect((await names()).q).toHaveLength(15);
    expect((await names()).c).toHaveLength(6);
    expect(await db.select().from(auditLogs)).toHaveLength(0);
  });

  it('real run deletes exactly what the dry run counted, keeps open and billed rows', async () => {
    const dry = await runRetention({ dryRun: true, now: NOW });
    const deletePhotos = vi.fn(async (_urls: string[]) => {});
    const r = await runRetention({ now: NOW, deletePhotos });
    expect(r).toMatchObject({ quotes: dry.quotes, contacts: dry.contacts, photos: dry.photos });
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
    expect(deletePhotos).toHaveBeenCalledWith(expect.arrayContaining([photo('a'), photo('b'), photo('c')]));
    expect(deletePhotos.mock.calls[0]![0]).toHaveLength(3);

    const audit = await db.select().from(auditLogs);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ action: 'privacy.retention', actorId: null });
    expect(JSON.stringify(audit[0])).not.toMatch(/PRIVATE|example\.com|cloudinary|qdone|cspam/);
  });

  it('a photo deletion failure never fails the purge', async () => {
    const r = await runRetention({
      now: NOW,
      deletePhotos: async () => {
        throw new Error('cloud down');
      },
    });
    expect(r.quotes.expired).toBe(3);
  });

  it('a second run finds nothing and writes no audit row', async () => {
    await runRetention({ now: NOW, deletePhotos: async () => {} });
    await db.execute(sql`truncate table audit_logs`);
    const r = await runRetention({ now: NOW, deletePhotos: async () => {} });
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

describe('cloudinaryPublicId', () => {
  it('extracts the public id and ignores foreign urls', () => {
    expect(cloudinaryPublicId(photo('a'))).toBe('vantage/quotes/a');
    expect(cloudinaryPublicId('https://evil.example/image/upload/v1/x.jpg')).toBeNull();
    expect(cloudinaryPublicId('not a url')).toBeNull();
    const t = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_100/e_blur:5/v12/vantage/quotes/a.jpg';
    expect(cloudinaryPublicId(t)).toBe('vantage/quotes/a');
    expect(cloudinaryPublicId('https://res.cloudinary.com/demo/image/upload/vantage/quotes/a.png')).toBe(
      'vantage/quotes/a',
    );
  });
});
