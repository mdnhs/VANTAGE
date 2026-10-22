import 'server-only';

import type { Metadata, MetadataRoute } from 'next';
import { cacheLife, cacheTag } from 'next/cache';

import type { GlobalValue } from '@/lib/content/globals';
import type { ImageRef } from '@/lib/content/image-ref';
import { seoPageKey } from '@/lib/content/globals-seo';
import type { PublicImage } from '@/lib/media/public-image';
import { pageMetadata } from '@/lib/seo/metadata';
import { PUBLIC_PAGE_LIST, type PublicPageId } from '@/lib/seo/public-pages';
import { toPublicImage, loadPublicImages } from '@/server/lib/media/resolve';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { getSetting } from '@/server/queries/get-setting';
import { siteSettingsService, type PublicSiteSettings } from '@/server/services/site-settings-service';

// A stored image ref as a PublicImage: a live media row, or the legacy Cloudinary URL.
export async function resolveImageRef(ref: ImageRef): Promise<PublicImage | null> {
  if (!ref) return null;
  if (ref.kind === 'media') return (await loadPublicImages([ref.id]))[ref.id.toLowerCase()] ?? null;
  return toPublicImage(null, { publicId: ref.publicId, resourceType: 'image' });
}

// The public settings carry the legacy meta title, description and Twitter handle until `settings:migrate`
// has run (and treat a value equal to the derived one as "not set"), so the site-wide SEO defaults take them from there.
export function withLegacyMeta(
  defaults: GlobalValue<'seo'>,
  settings: Pick<PublicSiteSettings, 'metaTitle' | 'metaDescription' | 'twitterHandle'>,
): GlobalValue<'seo'> {
  return {
    ...defaults,
    defaultTitle: settings.metaTitle ?? '',
    defaultDescription: settings.metaDescription ?? '',
    twitterHandle: settings.twitterHandle ?? '',
  };
}

// Metadata for one public page. Only cached readers are used, so the page stays static.
export async function getPageMetadata(id: PublicPageId): Promise<Metadata> {
  const [settings, defaults, seo] = await Promise.all([
    siteSettingsService.getPublic(),
    getSetting('seo'),
    getSetting(seoPageKey(id)),
  ]);
  const own = await resolveImageRef(seo.ogImage);
  return pageMetadata({
    id,
    seo,
    defaults: withLegacyMeta(defaults, settings),
    siteName: settings.businessName,
    ogImage: own ?? settings.ogImage,
  });
}

export type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
};

// Every page that may be indexed: none when the whole site is noindex, and not the pages set noindex.
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  'use cache';
  cacheTag(settingTag('seo'));
  for (const page of PUBLIC_PAGE_LIST) cacheTag(settingTag(seoPageKey(page.id)));
  cacheLife('max');

  const defaults = await getSetting('seo');
  if (defaults.robots === 'noindex') return [];
  const pages = await Promise.all(
    PUBLIC_PAGE_LIST.map(async (page) => ({ page, seo: await getSetting(seoPageKey(page.id)) })),
  );
  return (
    pages
      // A page whose canonical points elsewhere is not listed under its own address.
      .filter(({ page, seo }) => !seo.noindex && (!seo.canonical.trim() || seo.canonical === page.path))
      .map(({ page }) => ({
        path: page.path,
        changeFrequency: page.id === 'home' ? 'weekly' : 'monthly',
        priority: page.id === 'home' ? 1 : 0.6,
      }))
  );
}
