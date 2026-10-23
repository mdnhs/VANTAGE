import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// One row per global settings document. Optimistic concurrency via `version`.
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  draft: jsonb('draft').$type<unknown>(),
  version: integer('version').notNull().default(1),
  // Attribution only; no FK (Phase 2 adds it once admins move to users).
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Setting = typeof settings.$inferSelect;
