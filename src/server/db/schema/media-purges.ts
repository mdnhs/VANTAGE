import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const MEDIA_PURGE_REASONS = ['replaced', 'deleted'] as const;
export type MediaPurgeReason = (typeof MEDIA_PURGE_REASONS)[number];

// Stored files waiting to be removed once a grace period has passed. Keyed by storage key, so a
// key is queued at most once.
export const mediaObjectPurges = pgTable(
  'media_object_purges',
  {
    key: text('key').primaryKey(),
    reason: varchar('reason', { length: 16 }).$type<MediaPurgeReason>().notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('media_object_purges_due_at_idx').on(t.dueAt),
    check('media_object_purges_reason_check', sql`${t.reason} in ('replaced', 'deleted')`),
  ],
);

export type MediaObjectPurge = typeof mediaObjectPurges.$inferSelect;
