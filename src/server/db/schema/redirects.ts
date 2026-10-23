import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Old public addresses that send visitors elsewhere. Rows are flattened on write (no chains).
export const redirects = pgTable(
  'redirects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourcePath: text('source_path').notNull().unique(),
    destination: text('destination').notNull(),
    statusCode: integer('status_code').notNull().default(301),
    isActive: boolean('is_active').notNull().default(true),
    hitCount: integer('hit_count').notNull().default(0),
    lastHitAt: timestamp('last_hit_at', { withTimezone: true }),
    note: text('note').notNull().default(''),
    // Attribution only; no FK (like media.created_by).
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('redirects_is_active_idx').on(t.isActive),
    check('redirects_status_code_check', sql`${t.statusCode} in (301, 302, 307, 308)`),
    check('redirects_source_not_destination_check', sql`${t.sourcePath} <> ${t.destination}`),
  ],
);

export type Redirect = typeof redirects.$inferSelect;
export type NewRedirect = typeof redirects.$inferInsert;
