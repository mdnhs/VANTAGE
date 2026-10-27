import type { Metadata } from 'next';

import type { GlobalValue } from '@/lib/content/globals';
import type { SeoPageKey } from '@/lib/content/globals-seo';
import type { PublicImage } from '@/lib/media/public-image';

import { HOME_DESCRIPTION, PUBLIC_PAGES, type PublicPageId } from './public-pages';
import { documentTitle, effectiveTemplate } from './title';

export const OG_SIZE = { width: 1200, height: 630 } as const;
// The generated "Vantage" share card (src/app/og/route.tsx).
export const GENERATED_OG = '/og';
// The per-page card (src/app/og/[page]/route.tsx), used when a page has no share image.
export const pageOgPath = (id: PublicPageId): string => `/og/${id}`;
const LOCALE = 'en_IE';

// A stored "" or whitespace counts as missing, so the fallbacks still apply.
export function blank(v: string | null | undefined): string | null {
  return v?.trim() ? v : null;
}

export type PageSeoInput = {
  id: PublicPageId;
  seo: GlobalValue<SeoPageKey>;
  defaults: GlobalValue<'seo'>;
  siteName: string;
  // The page's share image, else the site default; resolved by the caller. null -> generated card.
  ogImage: PublicImage | null;
};

// Own description; else home falls back to the site default then the registry text, the others to the registry text.
export function pageDescription(i: PageSeoInput): string | null {
  const page = PUBLIC_PAGES[i.id];
  const own = blank(i.seo.description);
  if (own) return own;
  if (i.id === 'home') return blank(i.defaults.defaultDescription) ?? blank(HOME_DESCRIPTION);
  return blank(page.description);
}

export function pageMetadata(i: PageSeoInput): Metadata {
  const page = PUBLIC_PAGES[i.id];
  const title = documentTitle(
    { id: i.id, seoTitle: i.seo.title },
    { titleTemplate: i.defaults.titleTemplate, siteName: i.siteName },
  );
  const description = pageDescription(i) ?? undefined;
  const canonical = blank(i.seo.canonical) ?? page.path;
  const ogTitle = blank(i.seo.ogTitle) ?? title;
  const ogDescription = blank(i.seo.ogDescription) ?? description;
  const image = i.ogImage
    ? {
        url: i.ogImage.src,
        width: i.ogImage.width ?? undefined,
        height: i.ogImage.height ?? undefined,
        alt: i.ogImage.alt || ogTitle,
      }
    : { url: pageOgPath(i.id), ...OG_SIZE, alt: ogTitle };
  const robots =
    i.defaults.robots === 'noindex'
      ? { index: false, follow: false }
      : i.seo.noindex
        ? { index: false, follow: true }
        : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    // A child's openGraph replaces the parent's whole object, so the site-wide fields are repeated.
    openGraph: {
      type: 'website',
      siteName: i.siteName,
      locale: LOCALE,
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      images: [image],
    },
    twitter: {
      card: i.seo.twitterCard,
      site: blank(i.defaults.twitterHandle) ?? undefined,
      title: ogTitle,
      description: ogDescription,
      images: [image.url],
    },
    ...(robots ? { robots } : {}),
  };
}

export type RootMetadataInput = {
  appUrl: string;
  seo: GlobalValue<'seo'>;
  siteName: string;
  hoursSummary: string;
  defaultOgImage: PublicImage | null;
  // The uploaded favicon, else the logo; with neither, the browser tab shows no icon.
  icon?: PublicImage | null;
};

// The site-root metadata: fallbacks every page overrides per field.
export function rootMetadata(i: RootMetadataInput): Metadata {
  const { seo, siteName } = i;
  const title = seo.defaultTitle || siteName;
  const description = seo.defaultDescription || `${siteName} — ${i.hoursSummary}`;
  const image = i.defaultOgImage
    ? {
        url: i.defaultOgImage.src,
        width: i.defaultOgImage.width ?? OG_SIZE.width,
        height: i.defaultOgImage.height ?? OG_SIZE.height,
        alt: i.defaultOgImage.alt || siteName,
      }
    : { url: GENERATED_OG, ...OG_SIZE, alt: siteName };
  const { google, bing } = seo.verification;
  return {
    metadataBase: new URL(i.appUrl),
    title: { default: title, template: effectiveTemplate({ titleTemplate: seo.titleTemplate, siteName }) },
    description,
    applicationName: siteName,
    ...(i.icon
      ? { icons: { icon: [{ url: i.icon.src, type: i.icon.mimeType ?? undefined }], apple: [{ url: i.icon.src }] } }
      : {}),
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: '/' },
    ...(google || bing
      ? {
          verification: {
            ...(google ? { google } : {}),
            ...(bing ? { other: { 'msvalidate.01': bing } } : {}),
          },
        }
      : {}),
    openGraph: {
      type: 'website',
      siteName,
      locale: LOCALE,
      url: '/',
      title,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      site: seo.twitterHandle || undefined,
      title,
      description,
      images: [image.url],
    },
    robots:
      seo.robots === 'noindex'
        ? { index: false, follow: false }
        : {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
          },
  };
}
