import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// `status` is a plain varchar validated in Zod ('published' | 'hidden'), not a DB enum —
// matches the varchar-status convention used by `projects`. `rating` is a plain integer;
// the 1-5 bound is enforced in Zod (`testimonial-schema.ts`), not a DB CHECK constraint.
export const testimonials = pgTable(
  'testimonials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerName: varchar('customer_name', { length: 120 }).notNull(),
    rating: integer('rating').notNull(),
    reviewText: text('review_text').notNull(),
    avatarPublicId: varchar('avatar_public_id', { length: 255 }),
    serviceReceived: varchar('service_received', { length: 120 }),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    isFeatured: boolean('is_featured').notNull().default(false),
    status: varchar('status', { length: 16 }).notNull().default('published'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('testimonials_status_order_idx').on(table.status, table.displayOrder)],
);

export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;
