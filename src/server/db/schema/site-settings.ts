import { boolean, pgTable, smallint, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Singleton config table — exactly one row, always id=1. No indexes needed: every read is a
// primary-key lookup on a single-row table.
export const siteSettings = pgTable('site_settings', {
  id: smallint('id').primaryKey().default(1),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  emergencyPhone: varchar('emergency_phone', { length: 50 }),
  email: varchar('email', { length: 255 }).notNull(),
  address: text('address').notNull(),
  openingHours: text('opening_hours').notNull(),
  googleMapsUrl: varchar('google_maps_url', { length: 1000 }),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  facebookUrl: varchar('facebook_url', { length: 1000 }),
  instagramUrl: varchar('instagram_url', { length: 1000 }),
  tiktokUrl: varchar('tiktok_url', { length: 1000 }),
  linkedinUrl: varchar('linkedin_url', { length: 1000 }),
  logoPublicId: varchar('logo_public_id', { length: 500 }),
  faviconPublicId: varchar('favicon_public_id', { length: 500 }),
  heroVideoPublicId: varchar('hero_video_public_id', { length: 500 }),
  heroFallbackImagePublicId: varchar('hero_fallback_image_public_id', { length: 500 }),
  heroVideoEnabled: boolean('hero_video_enabled').notNull().default(false),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  ogImagePublicId: varchar('og_image_public_id', { length: 500 }),
  twitterHandle: varchar('twitter_handle', { length: 50 }),
  heroEyebrow: varchar('hero_eyebrow', { length: 200 }),
  heroHeadlineLine1: varchar('hero_headline_line1', { length: 100 }),
  heroHeadlineLine2: varchar('hero_headline_line2', { length: 100 }),
  heroHeadlineAccent: varchar('hero_headline_accent', { length: 100 }),
  heroSubtext: text('hero_subtext'),
  trustBadge1Title: varchar('trust_badge1_title', { length: 100 }),
  trustBadge1Subtitle: varchar('trust_badge1_subtitle', { length: 150 }),
  trustBadge2Title: varchar('trust_badge2_title', { length: 100 }),
  trustBadge2Subtitle: varchar('trust_badge2_subtitle', { length: 150 }),
  trustBadge3Title: varchar('trust_badge3_title', { length: 100 }),
  trustBadge3Subtitle: varchar('trust_badge3_subtitle', { length: 150 }),
  trustBadge4Title: varchar('trust_badge4_title', { length: 100 }),
  trustBadge4Subtitle: varchar('trust_badge4_subtitle', { length: 150 }),
  catalogEyebrow: varchar('catalog_eyebrow', { length: 200 }),
  catalogHeadlineLine1: varchar('catalog_headline_line1', { length: 100 }),
  catalogHeadlineAccent: varchar('catalog_headline_accent', { length: 100 }),
  catalogSubtext: text('catalog_subtext'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type NewSiteSettings = typeof siteSettings.$inferInsert;
