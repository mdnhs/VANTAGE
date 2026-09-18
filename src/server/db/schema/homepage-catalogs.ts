import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const homepageCatalogs = pgTable(
  'homepage_catalogs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description').notNull(),
    badge: varchar('badge', { length: 80 }),
    footnote: varchar('footnote', { length: 80 }).default('Free Estimate'),
    icon: varchar('icon', { length: 40 }).notNull().default('car-front'),
    iconPublicId: varchar('icon_public_id', { length: 255 }),
    displayOrder: integer('display_order').notNull().default(0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('homepage_catalogs_display_order_idx').on(table.displayOrder)],
);

export type HomepageCatalog = typeof homepageCatalogs.$inferSelect;
export type NewHomepageCatalog = typeof homepageCatalogs.$inferInsert;
