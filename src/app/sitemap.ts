import type { MetadataRoute } from 'next';
import { cacheLife, cacheTag } from 'next/cache';

import { getSitemapEntries } from '@/server/queries/get-page-seo';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache';
  cacheTag('sitemap');
  cacheLife('max');

  // new Date() is non-deterministic and would otherwise force this route to render per
  // request; 'use cache' captures one build-time value and serves it until the tag expires.
  const lastModified = new Date();

  return (await getSitemapEntries()).map(({ path, changeFrequency, priority }) => ({
    url: path === '/' ? `${APP_URL}/` : `${APP_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
