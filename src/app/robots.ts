import type { MetadataRoute } from 'next';
import { cacheLife, cacheTag } from 'next/cache';

import { robotsFor, siteEnvFrom } from '@/lib/seo/robots';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { getSetting } from '@/server/queries/get-setting';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export default async function robots(): Promise<MetadataRoute.Robots> {
  'use cache';
  cacheTag(settingTag('seo'));
  cacheLife('max');

  return robotsFor(
    siteEnvFrom({ SITE_ENV: process.env.SITE_ENV, VERCEL_ENV: process.env.VERCEL_ENV }),
    await getSetting('seo'),
    APP_URL,
  );
}
