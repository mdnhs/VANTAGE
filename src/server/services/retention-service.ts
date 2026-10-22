import 'server-only';

import { and, count, eq, inArray, isNull, lt, not, or, type SQL } from 'drizzle-orm';

import { parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { contactMessages, quoteRequests } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import { settingsRepository } from '@/server/repositories/settings-repository';

const DAY = 86_400_000;

// Only rows the team has finished with, and that carry no money, are ever purged.
// Quotes: finished status, no invoice number, 'unpaid', nothing paid, no payment method. Contacts: replied or archived.
export const TERMINAL_QUOTE_STATUSES = ['completed', 'cancelled', 'archived'] as const;
export const TERMINAL_CONTACT_STATUSES = ['replied', 'archived'] as const;
// No spam marking exists yet, so nothing matches today; the window applies once rows can carry it.
export const SPAM_STATUS = 'spam';

export type RetentionCounts = { expired: number; spam: number };
export type RetentionResult = {
  dryRun: boolean;
  quotes: RetentionCounts;
  contacts: RetentionCounts;
  photos: number;
  windows: { enquiryRetentionMonths: number; spamRetentionDays: number };
};

export const retentionCutoffs = (now: Date, windows: RetentionResult['windows']) => {
  const enquiryBefore = new Date(now);
  enquiryBefore.setUTCMonth(enquiryBefore.getUTCMonth() - windows.enquiryRetentionMonths);
  return { enquiryBefore, spamBefore: new Date(now.getTime() - windows.spamRetentionDays * DAY) };
};

// https://res.cloudinary.com/<cloud>/image/upload/v123/folder/name.jpg -> folder/name
export const cloudinaryPublicId = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname !== 'res.cloudinary.com') return null;
    const m = /\/upload\/(?:[^/]+\/)*?(?:v\d+\/)(.+)$/.exec(u.pathname) ?? /\/upload\/(.+)$/.exec(u.pathname);
    if (!m) return null;
    return decodeURIComponent(m[1]!).replace(/\.[A-Za-z0-9]+$/, '');
  } catch {
    return null;
  }
};

// Best effort, after the rows are gone: skipped when Cloudinary is not configured, failures are
// logged without any URL or customer data. TODO(phase 5): media-library (R2) refs.
export async function deleteCloudinaryPhotos(urls: string[]): Promise<void> {
  const ids = [...new Set(urls.map(cloudinaryPublicId).filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return;
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return;
  try {
    const { destroyAsset } = await import('@/lib/cloudinary/server');
    const results = await Promise.allSettled(ids.map((id) => destroyAsset(id)));
    const failed = results.filter(
      (r) => r.status === 'rejected' || !['ok', 'not found'].includes(String(r.value?.result)),
    ).length;
    if (failed > 0) console.error(`[retention] ${failed} of ${ids.length} photos could not be deleted`);
  } catch {
    console.error('[retention] photo deletion skipped: Cloudinary unavailable');
  }
}

const photoCount = (rows: { photoUrls: string[] | null }[]) => rows.reduce((n, r) => n + (r.photoUrls?.length ?? 0), 0);

// Permanent deletion lives only here. Spam (status exactly 'spam') ages from its last update;
// finished, unbilled enquiries age from their last update too. Counts only ever leave this
// function: no customer data.
export async function runRetention({
  dryRun = false,
  now = new Date(),
  deletePhotos = deleteCloudinaryPhotos,
}: { dryRun?: boolean; now?: Date; deletePhotos?: (urls: string[]) => Promise<void> } = {}): Promise<RetentionResult> {
  const privacy = parseGlobal('privacy', (await settingsRepository.get('privacy'))?.value);
  const windows = {
    enquiryRetentionMonths: privacy.enquiryRetentionMonths,
    spamRetentionDays: privacy.spamRetentionDays,
  };
  const { enquiryBefore, spamBefore } = retentionCutoffs(now, windows);

  const quoteSpam: SQL = and(eq(quoteRequests.status, SPAM_STATUS), lt(quoteRequests.updatedAt, spamBefore))!;
  const quoteExpired: SQL = and(
    inArray(quoteRequests.status, [...TERMINAL_QUOTE_STATUSES]),
    // Every billing column must be empty: invoice, payment status, amount paid, payment method.
    isNull(quoteRequests.invoiceNumber),
    eq(quoteRequests.paymentStatus, 'unpaid'),
    or(isNull(quoteRequests.paidAmount), eq(quoteRequests.paidAmount, '0'))!,
    isNull(quoteRequests.paymentMethod),
    lt(quoteRequests.updatedAt, enquiryBefore),
  )!;
  const contactSpam: SQL = and(eq(contactMessages.status, SPAM_STATUS), lt(contactMessages.updatedAt, spamBefore))!;
  const contactExpired: SQL = and(
    inArray(contactMessages.status, [...TERMINAL_CONTACT_STATUSES]),
    lt(contactMessages.updatedAt, enquiryBefore),
  )!;

  if (dryRun) {
    const tally = async (table: typeof quoteRequests | typeof contactMessages, spam: SQL, expired: SQL) => {
      const rows = await db.select({ photoUrls: table.photoUrls }).from(table).where(or(spam, expired));
      const [s] = await db.select({ n: count() }).from(table).where(spam);
      const [e] = await db
        .select({ n: count() })
        .from(table)
        .where(and(expired, not(spam)));
      return { spam: s?.n ?? 0, expired: e?.n ?? 0, photos: photoCount(rows) };
    };
    const q = await tally(quoteRequests, quoteSpam, quoteExpired);
    const c = await tally(contactMessages, contactSpam, contactExpired);
    return {
      dryRun,
      windows,
      photos: q.photos + c.photos,
      quotes: { spam: q.spam, expired: q.expired },
      contacts: { spam: c.spam, expired: c.expired },
    };
  }

  const photoUrls: string[] = [];
  const result = await db.transaction(async (tx) => {
    const take = (rows: { photoUrls: string[] | null }[]) => {
      for (const r of rows) photoUrls.push(...(r.photoUrls ?? []));
      return rows.length;
    };
    const del = async (table: typeof quoteRequests | typeof contactMessages, where: SQL) =>
      take(await tx.delete(table).where(where).returning({ photoUrls: table.photoUrls }));
    // Spam first, then the finished rows: the two counts never overlap.
    const quotes = { spam: await del(quoteRequests, quoteSpam), expired: await del(quoteRequests, quoteExpired) };
    const contacts = {
      spam: await del(contactMessages, contactSpam),
      expired: await del(contactMessages, contactExpired),
    };
    const total = quotes.spam + quotes.expired + contacts.spam + contacts.expired;
    if (total > 0) {
      await audit(
        null,
        {
          action: 'privacy.retention',
          entityType: 'enquiry',
          summary:
            `Retention purge: ${quotes.expired} quotes and ${contacts.expired} contact messages finished ` +
            `over ${windows.enquiryRetentionMonths} months ago, ${quotes.spam} quotes and ${contacts.spam} contact ` +
            `messages marked spam over ${windows.spamRetentionDays} days ago`,
        },
        tx,
      );
    }
    return { dryRun, windows, photos: photoUrls.length, quotes, contacts };
  });
  try {
    await deletePhotos(photoUrls);
  } catch {
    console.error('[retention] photo deletion failed');
  }
  return result;
}
