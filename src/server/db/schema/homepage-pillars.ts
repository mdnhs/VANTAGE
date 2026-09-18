import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const homepagePillars = pgTable(
  'homepage_pillars',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description').notNull(),
    icon: varchar('icon', { length: 40 }).notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('homepage_pillars_display_order_idx').on(table.displayOrder)],
);

export type HomepagePillar = typeof homepagePillars.$inferSelect;
export type NewHomepagePillar = typeof homepagePillars.$inferInsert;
