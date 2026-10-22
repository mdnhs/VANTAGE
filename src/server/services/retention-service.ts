import 'server-only';

import { and, count, eq, inArray, lt, not, notExists, or, sql, type SQL } from 'drizzle-orm';

import { parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { contactMessages, enquiryPhotos, media, quoteRequests } from '@/server/db/schema';
import { SPAM_STATUS } from '@/lib/enquiries/spam';
import { audit } from '@/server/lib/audit';
import { noBillingData } from '@/server/lib/enquiries/billing';
import { settingsRepository } from '@/server/repositories/settings-repository';

const DAY = 86_400_000;
const BATCH = 1000;
const chunk = <T>(items: T[]): T[][] =>
  Array.from({ length: Math.ceil(items.length / BATCH) }, (_, i) => items.slice(i * BATCH, (i + 1) * BATCH));

// Only rows the team has finished with, and that carry no money, are ever purged.
// Quotes: finished status, no invoice number, 'unpaid', nothing paid, no payment method. Contacts: replied or archived.
export const TERMINAL_QUOTE_STATUSES = ['completed', 'cancelled', 'archived'] as const;
export const TERMINAL_CONTACT_STATUSES = ['replied', 'archived'] as const;
export { SPAM_STATUS };

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
}: { dryRun?: boolean; now?: Date; deleteMedia?: (ids: string[]) => Promise<number> } = {}): Promise<RetentionResult> {
  const privacy = parseGlobal('privacy', (await settingsRepository.get('privacy'))?.value);
  const windows = {
    enquiryRetentionMonths: privacy.enquiryRetentionMonths,
    spamRetentionDays: privacy.spamRetentionDays,
  };
  const { enquiryBefore, spamBefore } = retentionCutoffs(now, windows);

  const quoteSpam: SQL = and(
    eq(quoteRequests.status, SPAM_STATUS),
    noBillingData(),
    lt(quoteRequests.updatedAt, spamBefore),
  )!;
  const quoteExpired: SQL = and(
    inArray(quoteRequests.status, [...TERMINAL_QUOTE_STATUSES]),
    noBillingData(),
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
      let purged = 0;
      for (const batch of chunk(targets)) {
        const links = await tx
          .select({ parent: parentColumn(table), mediaId: enquiryPhotos.mediaId })
          .from(enquiryPhotos)
          .where(inArray(parentColumn(table), batch));
        const deleted = await tx
          .delete(table)
          .where(and(where, inArray(table.id, batch)))
          .returning({ id: table.id, photoUrls: table.photoUrls });
        const gone = new Set(deleted.map((r) => r.id));
        for (const l of links) if (l.parent && gone.has(l.parent)) mediaIds.push(l.mediaId);
        legacyPhotos += legacyPhotoCount(deleted);
        purged += deleted.length;
      }
      return purged;
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
  // Counts are what the delete reports it removed, not what was selected.
  // A failing batch is logged and skipped; the total keeps what the other batches removed.
  const removeAll = async (ids: string[], failure: string) => {
    let removed = 0;
    for (const batch of chunk(ids)) {
      try {
        removed += Number(await deleteMedia(batch));
      } catch {
        console.error(failure);
      }
    }
    return removed;
  };
  const photos = await removeAll(mediaIds, '[retention] photo deletion failed');
  let orphanPhotos = 0;
  try {
    const purged = new Set(mediaIds);
    const orphanIds = (await db.select({ id: media.id }).from(media).where(orphanWhere(now)))
      .map((r) => r.id)
      .filter((id) => !purged.has(id));
    orphanPhotos = await removeAll(orphanIds, '[retention] orphan photo sweep failed');
  } catch {
    console.error('[retention] orphan photo sweep failed');
  }
  return { dryRun, windows, photos, legacyPhotos, orphanPhotos, ...result };
}
