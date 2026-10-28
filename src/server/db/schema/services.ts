import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { TiptapDoc } from '@/validations/legal-page-schema';
import { media } from './media';

// Money convention: site-settings has no money fields to establish a precedent, so this
// stores `startingPrice` as a whole-unit integer (euros), not cents — simplest for a
// "starting from €X" marketing label with no arithmetic/rounding done on it anywhere.
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 140 }).notNull().unique(),
    description: text('description').notNull(),
    iconPublicId: varchar('icon_public_id', { length: 255 }),
    iconMediaId: uuid('icon_media_id').references(() => media.id, { onDelete: 'restrict' }),
    // Hero image + bullet list for the public /services page feature blocks.
    imagePublicId: varchar('image_public_id', { length: 255 }),
    imageMediaId: uuid('image_media_id').references(() => media.id, { onDelete: 'restrict' }),
    checklist: text('checklist').array().notNull().default([]),
    startingPrice: integer('starting_price'),
    // Rich-text body of the /services/<slug> detail page (Tiptap JSON); null shows no body.
    content: jsonb('content').$type<TiptapDoc>(),
    displayOrder: integer('display_order').notNull().default(0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('services_slug_idx').on(table.slug),
    index('services_enabled_order_idx').on(table.isEnabled, table.displayOrder),
  ],
);

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
