import * as z from 'zod';

import { PUBLIC_PAGE_IDS, type PublicPageId } from '@/lib/seo/public-pages';

import { imageRefSchema } from './image-ref';

// Per-page SEO: one versioned global `seo.page.<id>` per public page, so it gets the Phase 4
// RBAC, View-as refusal, audit, history and cache tags. Every field is optional; blank means
// "use the default" (the site-wide SEO defaults, then the page's own metadata).

const s = (max: number) => z.string().trim().max(max).default('');

// '' (own address), a site path with no trailing slash, query or hash, or an https address.
const Canonical = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === '' ||
      (/^\/(?!\/)[^\s?#\\]*$/.test(v) && (v === '/' || !v.endsWith('/'))) ||
      /^https:\/\/[^\s/?#]+(\/[^\s?#]*)?$/.test(v),
    'Use a path like /about (no trailing slash, query or #) or a full https:// address',
  )
  .default('');

export const PageSeoGlobal = z.object({
  title: s(70),
  description: s(320),
  ogTitle: s(70),
  ogDescription: s(200),
  ogImage: imageRefSchema.default(null),
  canonical: Canonical,
  twitterCard: z.enum(['summary_large_image', 'summary']).default('summary_large_image'),
  noindex: z.boolean().default(false),
});

export type SeoPageKey = `seo.page.${PublicPageId}`;

export const seoPageKey = (id: PublicPageId): SeoPageKey => `seo.page.${id}`;

export const SEO_PAGE_KEYS: readonly SeoPageKey[] = PUBLIC_PAGE_IDS.map((id) => seoPageKey(id));

export const SEO_PAGE_GLOBALS = Object.fromEntries(
  PUBLIC_PAGE_IDS.map((id) => [`seo.page.${id}`, PageSeoGlobal]),
) as Record<SeoPageKey, typeof PageSeoGlobal>;
