import type { Permissions } from '@/lib/auth/permissions';
import { PUBLIC_PAGES } from '@/lib/seo/public-pages';

import { SEO_PAGE_KEYS, type SeoPageKey } from './globals-seo';

// Registered into global-access.ts with one-line spreads. Editing a page's SEO is the `seo`
// permission, separate from editing its copy (`page`).
type Access = { read: Permissions; update: Permissions };

const seoAccess = { read: { seo: ['read'] }, update: { seo: ['update'] } } satisfies Access;

export const SEO_PAGE_GLOBAL_ACCESS = Object.fromEntries(SEO_PAGE_KEYS.map((key) => [key, seoAccess])) as Record<
  SeoPageKey,
  Access
>;

export const SEO_PAGE_GLOBAL_LABELS = Object.fromEntries(
  SEO_PAGE_KEYS.map((key) => [
    key,
    `${PUBLIC_PAGES[key.slice('seo.page.'.length) as keyof typeof PUBLIC_PAGES].label} SEO`,
  ]),
) as Record<SeoPageKey, string>;
