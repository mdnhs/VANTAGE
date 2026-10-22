import 'server-only';

import { and, count, eq, inArray, isNull, lt, not, notExists, notInArray, or, sql, type SQL } from 'drizzle-orm';

import { parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { contactMessages, enquiryPhotos, media, quoteRequests } from '@/server/db/schema';
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
  // Linked media files of the purged enquiries, legacy `photo_urls` strings (left for the
  // cleanup script) and unlinked enquiry files older than a day.
  photos: number;
  legacyPhotos: number;
  orphanPhotos: number;
  windows: { enquiryRetentionMonths: number; spamRetentionDays: number };
};

export const retentionCutoffs = (now: Date, windows: RetentionResult['windows']) => {
  const enquiryBefore = new Date(now);
  enquiryBefore.setUTCMonth(enquiryBefore.getUTCMonth() - windows.enquiryRetentionMonths);
  return { enquiryBefore, spamBefore: new Date(now.getTime() - windows.spamRetentionDays * DAY) };
};

const legacyPhotoCount = (rows: { photoUrls: string[] | null }[]) =>
  rows.reduce((n, r) => n + (r.photoUrls?.length ?? 0), 0);

type Table = typeof quoteRequests | typeof contactMessages;
const parentColumn = (table: Table) =>
  table === quoteRequests ? enquiryPhotos.quoteRequestId : enquiryPhotos.contactMessageId;

// Enquiry-scope media no lead links to, uploaded over a day ago (a visitor's photo is linked in
// the same request that stores it, so anything older is left over from a failed submission).
const orphanWhere = (now: Date): SQL =>
  and(
    eq(media.scope, 'enquiry'),
    lt(media.createdAt, new Date(now.getTime() - DAY)),
    notExists(
      db
        .select({ one: sql`1` })
        .from(enquiryPhotos)
        .where(eq(enquiryPhotos.mediaId, media.id)),
    ),
  )!;

// Best effort, after the rows are gone: the row, then the stored file. Failures log a constant
// line, never an id, key or customer data.
const defaultDeleteMedia = async (ids: string[]) => {
  const { hardDeleteEnquiryMedia } = await import('@/server/services/media-library-service');
  return hardDeleteEnquiryMedia(ids);
};

// Permanent deletion lives only here. Spam (status exactly 'spam') ages from its last update;
// finished, unbilled enquiries age from their last update too. Counts only ever leave this
// function: no customer data.
export async function runRetention({
  dryRun = false,
  now = new Date(),
  deleteMedia = defaultDeleteMedia,
}: { dryRun?: boolean; now?: Date; deleteMedia?: (ids: string[]) => Promise<unknown> } = {}): Promise<RetentionResult> {
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
    const tally = async (table: Table, spam: SQL, expired: SQL) => {
      const rows = await db.select({ photoUrls: table.photoUrls }).from(table).where(or(spam, expired));
      const [s] = await db.select({ n: count() }).from(table).where(spam);
      const [e] = await db
        .select({ n: count() })
        .from(table)
        .where(and(expired, not(spam)));
      const [m] = await db
        .select({ n: count() })
        .from(enquiryPhotos)
        .where(inArray(parentColumn(table), db.select({ id: table.id }).from(table).where(or(spam, expired))));
      return { spam: s?.n ?? 0, expired: e?.n ?? 0, legacy: legacyPhotoCount(rows), photos: m?.n ?? 0 };
    };
    const q = await tally(quoteRequests, quoteSpam, quoteExpired);
    const c = await tally(contactMessages, contactSpam, contactExpired);
    const [o] = await db.select({ n: count() }).from(media).where(orphanWhere(now));
    return {
      dryRun,
      windows,
      photos: q.photos + c.photos,
      legacyPhotos: q.legacy + c.legacy,
      orphanPhotos: o?.n ?? 0,
      quotes: { spam: q.spam, expired: q.expired },
      contacts: { spam: c.spam, expired: c.expired },
    };
  }

  const mediaIds: string[] = [];
  let legacyPhotos = 0;
  const result = await db.transaction(async (tx) => {
    // Lock the matching rows, note their linked media (the links cascade away with the rows),
    // then delete only those rows, still under the shared predicate.
    const del = async (table: Table, where: SQL) => {
      const targets = (await tx.select({ id: table.id }).from(table).where(where).for('update')).map((r) => r.id);
      if (targets.length === 0) return 0;
      const links = await tx
        .select({ parent: parentColumn(table), mediaId: enquiryPhotos.mediaId })
        .from(enquiryPhotos)
        .where(inArray(parentColumn(table), targets));
      const deleted = await tx
        .delete(table)
        .where(and(where, inArray(table.id, targets)))
        .returning({ id: table.id, photoUrls: table.photoUrls });
      const gone = new Set(deleted.map((r) => r.id));
      for (const l of links) if (l.parent && gone.has(l.parent)) mediaIds.push(l.mediaId);
      legacyPhotos += legacyPhotoCount(deleted);
      return deleted.length;
    };
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
    return { quotes, contacts };
  });

  // After the commit, best effort: a failure leaves unlinked files the next sweep picks up.
  try {
    await deleteMedia(mediaIds);
  } catch {
    console.error('[retention] photo deletion failed');
  }
  let orphanPhotos = 0;
  try {
    const orphanIds = (
      await db
        .select({ id: media.id })
        .from(media)
        .where(and(orphanWhere(now), mediaIds.length > 0 ? notInArray(media.id, mediaIds) : undefined))
    ).map((r) => r.id);
    if (orphanIds.length > 0) {
      await deleteMedia(orphanIds);
      orphanPhotos = orphanIds.length;
    }
  } catch {
    console.error('[retention] orphan photo sweep failed');
  }
  return { dryRun, windows, photos: mediaIds.length, legacyPhotos, orphanPhotos, ...result };
}
