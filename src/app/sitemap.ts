import type { MetadataRoute } from 'next';
import { cacheLife, cacheTag } from 'next/cache';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache';
  cacheTag('sitemap');
  cacheLife('days');

  // new Date() is non-deterministic and would otherwise force this route to render per
  // request; 'use cache' captures one build-time value and serves it until the tag expires.
  const lastModified = new Date();

  return [
    { url: `${APP_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${APP_URL}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    // TODO: add dynamic entries via a cached service as public content is scaffolded
  ];
}
