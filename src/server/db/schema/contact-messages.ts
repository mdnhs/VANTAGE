import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 80 }).notNull(),
    lastName: varchar('last_name', { length: 80 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    service: varchar('service', { length: 120 }),
    message: text('message').notNull(),
    photoUrls: jsonb('photo_urls').$type<string[]>().default([]),
    status: varchar('status', { length: 40 }).notNull().default('new'),
    adminNotes: text('admin_notes'),
    source: varchar('source', { length: 60 }).notNull().default('contact_page'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('contact_messages_status_idx').on(table.status),
    index('contact_messages_created_at_idx').on(table.createdAt),
  ],
);

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
