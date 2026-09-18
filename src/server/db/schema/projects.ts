import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// `status` is a plain varchar validated in Zod ('draft' | 'published'), not a DB enum —
// matches the varchar-status convention already used elsewhere in this repo.
// `serviceCategory` is free text (a badge label), not FK'd to the services table — projects
// can reference a category name even after the matching service is renamed/removed.
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 180 }).notNull().unique(),
    vehicleModel: varchar('vehicle_model', { length: 120 }).notNull(),
    serviceCategory: varchar('service_category', { length: 80 }).notNull(),
    beforeImagePublicId: varchar('before_image_public_id', { length: 255 }).notNull(),
    afterImagePublicId: varchar('after_image_public_id', { length: 255 }).notNull(),
    description: text('description').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    isFeatured: boolean('is_featured').notNull().default(false),
    status: varchar('status', { length: 16 }).notNull().default('draft'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('projects_slug_idx').on(table.slug),
    index('projects_status_order_idx').on(table.status, table.displayOrder),
    index('projects_featured_status_idx').on(table.isFeatured, table.status),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
