import { index, integer, jsonb, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const quoteRequests = pgTable(
  'quote_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    registration: varchar('registration', { length: 40 }),
    make: varchar('make', { length: 80 }),
    model: varchar('model', { length: 80 }),
    year: integer('year'),
    serviceType: varchar('service_type', { length: 120 }),
    description: text('description'),
    photoUrls: jsonb('photo_urls').$type<string[]>().default([]),
    status: varchar('status', { length: 40 }).notNull().default('new'),
    estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }),
    adminNotes: text('admin_notes'),
    source: varchar('source', { length: 60 }).notNull().default('website'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('quote_requests_status_idx').on(table.status),
    index('quote_requests_created_at_idx').on(table.createdAt),
  ],
);

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type NewQuoteRequest = typeof quoteRequests.$inferInsert;
