import { index, integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { TiptapDoc } from '@/validations/legal-page-schema';

// Admin-authored legal pages (privacy, terms, ...) served at the site root: /<slug>.
// `publishedAt` is the public "Last updated" date — bumped on publish and on a published
// page's title/content edit, never by a reorder or a slug-only rename.
export const legalPages = pgTable(
  'legal_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 140 }).notNull().unique(),
    content: jsonb('content').$type<TiptapDoc>().notNull(),
    status: varchar('status', { length: 16 }).$type<'draft' | 'published'>().notNull().default('draft'),
    displayOrder: integer('display_order').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('legal_pages_status_order_idx').on(table.status, table.displayOrder)],
);

export type LegalPage = typeof legalPages.$inferSelect;
export type NewLegalPage = typeof legalPages.$inferInsert;
