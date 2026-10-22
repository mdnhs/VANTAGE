import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Append-only proof of consent. No IP, no user id.
export const consentEvents = pgTable(
  'consent_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    consentId: uuid('consent_id').notNull(),
    analytics: boolean('analytics').notNull(),
    marketing: boolean('marketing').notNull(),
    revision: integer('revision').notNull(),
    bannerHash: text('banner_hash').notNull(),
    action: text('action').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('consent_events_action_check', sql`${t.action} in ('accept','reject','custom','withdraw')`),
    index('consent_events_consent_idx').on(t.consentId, t.createdAt),
  ],
);
