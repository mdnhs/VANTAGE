import { boolean, uuid, varchar } from 'drizzle-orm/pg-core';
import { media } from './media';

// The per-row search and sharing fields of a page served from a content row (a service,
// project or legal page), mirroring the SEO tab of the eight public pages. Blank falls back.
export const seoColumns = () => ({
  seoTitle: varchar('seo_title', { length: 70 }),
  seoDescription: varchar('seo_description', { length: 200 }),
  ogTitle: varchar('og_title', { length: 70 }),
  ogDescription: varchar('og_description', { length: 200 }),
  ogImageMediaId: uuid('og_image_media_id').references(() => media.id, { onDelete: 'restrict' }),
  // '' or null: the page's own address.
  canonical: varchar('canonical', { length: 300 }),
  noindex: boolean('noindex').notNull().default(false),
});
