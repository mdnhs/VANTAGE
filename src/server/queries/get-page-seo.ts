import 'server-only';

import type { Metadata, MetadataRoute } from 'next';
import { eq, max } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS } from '@/lib/cache/tags';

import type { ImageRef } from '@/lib/content/image-ref';
import { seoPageKey } from '@/lib/content/globals-seo';
import type { PublicImage } from '@/lib/media/public-image';
import { pageMetadata } from '@/lib/seo/metadata';
import { PUBLIC_PAGE_LIST, type PublicPageId } from '@/lib/seo/public-pages';
import { db } from '@/server/db';
import { projects, services } from '@/server/db/schema';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { loadPublicImages } from '@/server/lib/media/resolve';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { getSetting } from '@/server/queries/get-setting';
import { legalPageService } from '@/server/services/legal-page-service';
import { serviceService } from '@/server/services/service-service';
import { siteSettingsService } from '@/server/services/site-settings-service';

// A stored image ref as a PublicImage: a live media row only. Cloudinary refs return null.
export async function resolveImageRef(ref: ImageRef): Promise<PublicImage | null> {
  if (!ref || ref.kind === 'cloudinary') return null;
  if (ref.kind === 'media') return (await loadPublicImages([ref.id]))[ref.id.toLowerCase()] ?? null;
  return null;
}

// Metadata for one public page. Only cached readers are used, so the page stays static.
export async function getPageMetadata(id: PublicPageId): Promise<Metadata> {
  const [settings, defaults, seo] = await Promise.all([
    siteSettingsService.getPublic(),
    getSetting('seo'),
    getSetting(seoPageKey(id)),
  ]);
  const own = await resolveImageRef(seo.ogImage);
  const defaultOg = await resolveImageRef(defaults.defaultOgImage);
  return pageMetadata({
    id,
    seo,
    defaults,
    siteName: settings.businessName,
    ogImage: own ?? defaultOg,
  });
}

export type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
  lastModified?: Date;
};

// Blank, the page's own path, or its own absolute address (https://<site>/path) all point at the page itself.
export function isSelfCanonical(canonical: string, path: string, appUrl = process.env.NEXT_PUBLIC_APP_URL): boolean {
  const value = canonical.trim();
  if (!value || value === path) return true;
  if (!appUrl) return false;
  try {
    const url = new URL(value);
    const origin = new URL(appUrl).origin;
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    return url.origin === origin && pathname === path && !url.search && !url.hash;
  } catch {
    return false;
  }
}

const latest = (dates: (Date | null | undefined)[]) =>
  dates.reduce<Date | undefined>((a, d) => (d && (!a || d > a) ? d : a), undefined);

// Every page that may be indexed: none when the whole site is noindex, and not the pages set noindex.
// Each entry is dated by its own stored rows (copy, SEO, and the services/projects it lists).
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  'use cache';
  cacheTag(settingTag('seo'), CACHE_TAGS.all('services'), CACHE_TAGS.all('projects'), CACHE_TAGS.all('legal-pages'));
  for (const page of PUBLIC_PAGE_LIST) {
    cacheTag(settingTag(seoPageKey(page.id)));
    if (page.pageKey) cacheTag(settingTag(page.pageKey));
  }
  cacheLife('max');

  const defaults = await getSetting('seo');
  if (defaults.robots === 'noindex') return [];
  const [serviceRow] = await db
    .select({ at: max(services.updatedAt) })
    .from(services)
    .where(eq(services.isEnabled, true));
  const [projectRow] = await db
    .select({ at: max(projects.updatedAt) })
    .from(projects)
    .where(eq(projects.status, 'published'));
  const pages = await Promise.all(
    PUBLIC_PAGE_LIST.map(async (page) => {
      const [seoRow, copyRow] = await Promise.all([
        settingsRepository.get(seoPageKey(page.id)),
        page.pageKey ? settingsRepository.get(page.pageKey) : null,
      ]);
      return {
        page,
        seo: await getSetting(seoPageKey(page.id)),
        lastModified: latest([
          seoRow?.updatedAt,
          copyRow?.updatedAt,
          page.id === 'services' ? serviceRow?.at : null,
          page.id === 'our-work' ? projectRow?.at : null,
        ]),
      };
    }),
  );
  const serviceDetails = (await serviceService.listPublishedForSitemap()).map(({ slug, updatedAt }): SitemapEntry => ({
    path: `/services/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.5,
    lastModified: updatedAt,
  }));
  const legal = (await legalPageService.listPublishedForSitemap()).map(({ slug, publishedAt }): SitemapEntry => ({
    path: `/${slug}`,
    changeFrequency: 'yearly',
    priority: 0.3,
    ...(publishedAt ? { lastModified: publishedAt } : {}),
  }));
  return [
    ...pages
      // A page whose canonical points elsewhere is not listed under its own address.
      .filter(({ page, seo }) => !seo.noindex && isSelfCanonical(seo.canonical, page.path))
      .map(({ page, lastModified }): SitemapEntry => ({
        path: page.path,
        changeFrequency: page.id === 'home' ? 'weekly' : 'monthly',
        priority: page.id === 'home' ? 1 : 0.6,
        ...(lastModified ? { lastModified } : {}),
      })),
    ...serviceDetails,
    ...legal,
  ];
}
