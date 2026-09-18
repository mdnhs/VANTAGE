import { boolean, index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const partnerLogos = pgTable(
  'partner_logos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyName: varchar('company_name', { length: 120 }).notNull(),
    logoPublicId: varchar('logo_public_id', { length: 255 }).notNull(),
    websiteUrl: varchar('website_url', { length: 255 }),
    displayOrder: integer('display_order').notNull().default(0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('partner_logos_enabled_order_idx').on(table.isEnabled, table.displayOrder)],
);

export type PartnerLogo = typeof partnerLogos.$inferSelect;
export type NewPartnerLogo = typeof partnerLogos.$inferInsert;
