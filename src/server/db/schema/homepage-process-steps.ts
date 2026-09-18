import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const homepageProcessSteps = pgTable(
  'homepage_process_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description').notNull(),
    isHighlighted: boolean('is_highlighted').notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('homepage_process_steps_display_order_idx').on(table.displayOrder)],
);

export type HomepageProcessStep = typeof homepageProcessSteps.$inferSelect;
export type NewHomepageProcessStep = typeof homepageProcessSteps.$inferInsert;
