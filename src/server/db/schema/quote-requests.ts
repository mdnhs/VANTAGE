import { index, integer, jsonb, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { adminUsers } from './admin-users';

export const quoteRequests = pgTable(
  'quote_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    address: text('address'),
    city: varchar('city', { length: 80 }),
    eircode: varchar('eircode', { length: 20 }),
    registration: varchar('registration', { length: 40 }),
    make: varchar('make', { length: 80 }),
    model: varchar('model', { length: 80 }),
    year: integer('year'),
    serviceType: varchar('service_type', { length: 120 }),
    description: text('description'),
    photoUrls: jsonb('photo_urls').$type<string[]>().default([]),
    status: varchar('status', { length: 40 }).notNull().default('new'),
    assignedAdminId: uuid('assigned_admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    inspectionDate: timestamp('inspection_date', { withTimezone: true }),
    estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }),
    paymentStatus: varchar('payment_status', { length: 40 }).notNull().default('unpaid'),
    paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).default('0.00'),
    paymentMethod: varchar('payment_method', { length: 60 }),
    invoiceNumber: varchar('invoice_number', { length: 60 }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    adminNotes: text('admin_notes'),
    source: varchar('source', { length: 60 }).notNull().default('website'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('quote_requests_status_idx').on(table.status),
    index('quote_requests_created_at_idx').on(table.createdAt),
    index('quote_requests_assigned_admin_idx').on(table.assignedAdminId),
    index('quote_requests_payment_status_idx').on(table.paymentStatus),
  ],
);

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type NewQuoteRequest = typeof quoteRequests.$inferInsert;
