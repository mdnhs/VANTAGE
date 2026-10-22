import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { cacheLife, cacheTag } from 'next/cache';
import { ImageResponse } from 'next/og';

import { seoPageKey } from '@/lib/content/globals-seo';
import { blank, OG_SIZE } from '@/lib/seo/metadata';
import { OgCard, type OgColors, type OgSubject } from '@/lib/seo/og-card';
import { PUBLIC_PAGES, type PublicPageId } from '@/lib/seo/public-pages';
import { toHex } from '@/lib/theme/color';
import { resolveSiteTokens } from '@/lib/theme/site';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { getSetting } from '@/server/queries/get-setting';
import { getPublishedTheme } from '@/server/queries/get-theme';
import { siteSettingsService } from '@/server/services/site-settings-service';

export { OgCard, type OgColors, type OgSubject };

// Read once per process; traced into the standalone build (outputFileTracingIncludes).
const inter = readFile(join(process.cwd(), 'assets/fonts/Inter-Regular.ttf'));

export async function renderOg(subject: OgSubject, colors: OgColors) {
  return new ImageResponse(<OgCard {...subject} colors={colors} />, {
    ...OG_SIZE,
    fonts: [{ name: 'Inter', data: await inter, weight: 400, style: 'normal' }],
  });
}

// What the card says for one page: its share title, else its SEO title, else the registry title
// (home: the site name). Expired by a save of the site, seo or this page's SEO document.
export async function ogSubjectFor(id: PublicPageId): Promise<OgSubject> {
  'use cache';
  cacheTag(settingTag('site'), settingTag('seo'), settingTag(seoPageKey(id)));
  cacheLife('max');
  const [site, seo] = await Promise.all([siteSettingsService.getPublic(), getSetting(seoPageKey(id))]);
  const siteName = site.businessName;
  const fallback = id === 'home' ? siteName : PUBLIC_PAGES[id].title;
  return {
    title: blank(seo.ogTitle) ?? blank(seo.title) ?? fallback,
    eyebrow: PUBLIC_PAGES.home.title,
    siteName,
  };
}

// Satori takes plain colours: the dark site background, white text, the published brand as accent.
export async function ogColors(): Promise<OgColors> {
  'use cache';
  cacheTag(settingTag('theme'));
  cacheLife('max');
  const { site } = await getPublishedTheme();
  return { background: '#131313', text: '#ffffff', accent: toHex(resolveSiteTokens(site).brand) };
}
