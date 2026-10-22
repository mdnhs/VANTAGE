import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// One row per global settings document. Optimistic concurrency via `version`.
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  draft: jsonb('draft').$type<unknown>(),
  version: integer('version').notNull().default(1),
  // Attribution only; no FK so settings survive user deletion.
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Setting = typeof settings.$inferSelect;
