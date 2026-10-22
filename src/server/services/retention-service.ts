import 'server-only';

import { and, count, inArray, lt, not, type SQL } from 'drizzle-orm';

import { parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { contactMessages, quoteRequests } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import { settingsRepository } from '@/server/repositories/settings-repository';

const DAY = 86_400_000;

// "Spam" in this schema is a closed-out status the team set by hand: a quote that was
// cancelled or archived, a contact message that was archived. There is no literal spam status.
export const SPAM_QUOTE_STATUSES = ['cancelled', 'archived'] as const;
export const SPAM_CONTACT_STATUSES = ['archived'] as const;

export type RetentionCounts = { expired: number; spam: number };
export type RetentionResult = {
  dryRun: boolean;
  quotes: RetentionCounts;
  contacts: RetentionCounts;
  windows: { enquiryRetentionMonths: number; spamRetentionDays: number };
};

export const retentionCutoffs = (now: Date, windows: RetentionResult['windows']) => {
  const enquiryBefore = new Date(now);
  enquiryBefore.setUTCMonth(enquiryBefore.getUTCMonth() - windows.enquiryRetentionMonths);
  return { enquiryBefore, spamBefore: new Date(now.getTime() - windows.spamRetentionDays * DAY) };
};

// Permanent deletion lives only here. Spam ages from its last update (when it was closed out),
// everything else from creation. Counts only ever leave this function: no customer data.
export async function runRetention({
  dryRun = false,
  now = new Date(),
}: { dryRun?: boolean; now?: Date } = {}): Promise<RetentionResult> {
  const privacy = parseGlobal('privacy', (await settingsRepository.get('privacy'))?.value);
  const windows = {
    enquiryRetentionMonths: privacy.enquiryRetentionMonths,
    spamRetentionDays: privacy.spamRetentionDays,
  };
  const { enquiryBefore, spamBefore } = retentionCutoffs(now, windows);

  const quoteSpam: SQL = and(
    inArray(quoteRequests.status, [...SPAM_QUOTE_STATUSES]),
    lt(quoteRequests.updatedAt, spamBefore),
  )!;
  const quoteExpired: SQL = lt(quoteRequests.createdAt, enquiryBefore);
  const contactSpam: SQL = and(
    inArray(contactMessages.status, [...SPAM_CONTACT_STATUSES]),
    lt(contactMessages.updatedAt, spamBefore),
  )!;
  const contactExpired: SQL = lt(contactMessages.createdAt, enquiryBefore);

  if (dryRun) {
    const tally = async (table: typeof quoteRequests | typeof contactMessages, spam: SQL, expired: SQL) => {
      const [s] = await db.select({ n: count() }).from(table).where(spam);
      const [e] = await db
        .select({ n: count() })
        .from(table)
        .where(and(expired, not(spam)));
      return { spam: s?.n ?? 0, expired: e?.n ?? 0 };
    };
    return {
      dryRun,
      windows,
      quotes: await tally(quoteRequests, quoteSpam, quoteExpired),
      contacts: await tally(contactMessages, contactSpam, contactExpired),
    };
  }

  return db.transaction(async (tx) => {
    // Spam first, then whatever is left past the enquiry window: the two counts never overlap.
    const quotes = {
      spam: (await tx.delete(quoteRequests).where(quoteSpam).returning({ id: quoteRequests.id })).length,
      expired: (await tx.delete(quoteRequests).where(quoteExpired).returning({ id: quoteRequests.id })).length,
    };
    const contacts = {
      spam: (await tx.delete(contactMessages).where(contactSpam).returning({ id: contactMessages.id })).length,
      expired: (await tx.delete(contactMessages).where(contactExpired).returning({ id: contactMessages.id })).length,
    };
    const total = quotes.spam + quotes.expired + contacts.spam + contacts.expired;
    if (total > 0) {
      await audit(
        null,
        {
          action: 'privacy.retention',
          entityType: 'enquiry',
          summary:
            `Retention purge: ${quotes.expired} quotes and ${contacts.expired} contact messages past ` +
            `${windows.enquiryRetentionMonths} months, ${quotes.spam} quotes and ${contacts.spam} contact ` +
            `messages closed out over ${windows.spamRetentionDays} days ago`,
        },
        tx,
      );
    }
    return { dryRun, windows, quotes, contacts };
  });
}
