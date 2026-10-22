import { describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';
import { seoPageKey } from '@/lib/content/globals-seo';

import { businessNode } from './json-ld';
import { pageMetadata } from './metadata';
import { PUBLIC_PAGE_IDS, type PublicPageId } from './public-pages';
import { robotsFor, siteEnvFrom } from './robots';

// With no SEO rows saved the public output must equal what the pages' own `metadata` produced
// before Phase 6 (title through the "%s | <site name>" template, home absolute).
const SITE = 'Vantage Autobody';
const TODAY: Record<PublicPageId, { title: string; description: string; canonical: string }> = {
  home: {
    title: `${SITE} — Precision Crash Repair & Restoration Dublin`,
    description:
      'Ireland’s premier automotive crash repair, precision chassis reconstruction, laser alignment, and high-end vehicle restoration center in Dublin. OEM certified and insurer approved.',
    canonical: '/',
  },
  services: {
    title: `Services | ${SITE}`,
    description:
      'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.',
    canonical: '/services',
  },
  'our-work': {
    title: `Our Work | ${SITE}`,
    description:
      'Explore a curated selection of our most challenging and rewarding restoration projects. Precision engineering meets master craftsmanship.',
    canonical: '/our-work',
  },
  insurance: {
    title: `Insurance Support | ${SITE}`,
    description:
      'We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road while our dedicated specialists coordinate seamlessly with your insurance provider.',
    canonical: '/insurance',
  },
  about: {
    title: `About | ${SITE}`,
    description:
      "Founded in 1998, Vantage Autobody has evolved into Ireland's premier high-end collision and repair facility.",
    canonical: '/about',
  },
  process: {
    title: `Our Process | ${SITE}`,
    description:
      'From initial digital triage to strict multi-point handoff inspection, the Vantage repair standard is transparently logged every time.',
    canonical: '/process',
  },
  contact: {
    title: `Contact | ${SITE}`,
    description:
      'We provide precise estimates based on detailed inspections. Reach out to schedule an appointment or ask technical questions.',
    canonical: '/contact',
  },
  'get-a-quote': {
    title: `Get a Free Quote | ${SITE}`,
    description:
      'Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation estimate from our master technicians.',
    canonical: '/get-a-quote',
  },
};

describe('default (no SEO rows) output equals today', () => {
  it.each(PUBLIC_PAGE_IDS)('%s: title, description, canonical, robots', (id) => {
    const m = pageMetadata({
      id,
      seo: parseGlobal(seoPageKey(id), undefined),
      defaults: parseGlobal('seo', undefined),
      siteName: SITE,
      ogImage: null,
    });
    expect(m.title).toEqual({ absolute: TODAY[id].title });
    expect(m.description).toBe(TODAY[id].description);
    expect(m.alternates?.canonical).toBe(TODAY[id].canonical);
    expect(m.robots).toBeUndefined();
  });

  it('robots.txt matches the old production output and the old non-production block', () => {
    const seo = parseGlobal('seo', undefined);
    expect(robotsFor(siteEnvFrom({ VERCEL_ENV: 'production' }), seo, 'https://x.ie')).toEqual({
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/api/', '/dashboard/', '/login', '/unauthorized', '/maintenance', '/*?*'],
        },
      ],
      sitemap: 'https://x.ie/sitemap.xml',
      host: 'https://x.ie',
    });
    expect(robotsFor(siteEnvFrom({ VERCEL_ENV: 'preview' }), seo, 'https://x.ie')).toEqual({
      rules: { userAgent: '*', disallow: '/' },
    });
    expect(siteEnvFrom({ SITE_ENV: 'preview', VERCEL_ENV: 'production' })).not.toBe('production');
  });

  it('businessNode lists a repeated sameAs url once', () => {
    const url = 'https://facebook.com/vantage';
    const seo = parseGlobal('seo', { business: { sameAs: [url] } });
    const site = parseGlobal('site', { social: [{ platform: 'facebook', url }] });
    const node = businessNode({ origin: 'https://x.ie', site, contact: parseGlobal('contact', undefined), seo });
    expect((node as { sameAs?: string[] }).sameAs).toEqual([url]);
  });
});
