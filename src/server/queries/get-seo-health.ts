import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { MEDIA_TAG } from '@/lib/cache/media-tag';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { seoPageKey } from '@/lib/content/globals-seo';
import { PUBLIC_PAGE_LIST } from '@/lib/seo/public-pages';
import { settingTag } from '@/server/lib/cache/settings-tags';
import type { SeoHealth } from '@/lib/seo/health-types';
import { computeSeoHealth } from '@/server/services/seo-health-service';

const ENTITY_TAGS = ['services', 'projects', 'testimonials', 'partner-logos', 'homepage-catalogs'].map((r) =>
  CACHE_TAGS.all(r),
);
const FEATURED_TAGS = ['projects-featured', 'testimonials-featured'].map((r) => CACHE_TAGS.list(r));

// The admin SEO report. Tagged with everything it reads (SEO defaults, site name, each page's
// SEO and copy documents, media alt text and the lists that name images), so any edit expires it.
export async function getSeoHealth(): Promise<SeoHealth> {
  'use cache';
  cacheTag(settingTag('seo'), settingTag('site'), settingTag('contact'), MEDIA_TAG, ...ENTITY_TAGS, ...FEATURED_TAGS);
  for (const p of PUBLIC_PAGE_LIST) {
    cacheTag(settingTag(seoPageKey(p.id)));
    if (p.pageKey) cacheTag(settingTag(p.pageKey));
  }
  cacheLife('max');
  return computeSeoHealth();
}
