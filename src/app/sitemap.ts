import type { MetadataRoute } from 'next';
import { cacheLife } from 'next/cache';

import { getSitemapEntries } from '@/server/queries/get-page-seo';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache';
  cacheLife('max');

  // A page with no stored rows has no date: omitting <lastmod> beats a made-up one.
  return (await getSitemapEntries()).map(({ path, changeFrequency, priority, lastModified }) => ({
    url: path === '/' ? `${APP_URL}/` : `${APP_URL}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  }));
}
