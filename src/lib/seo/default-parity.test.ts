import { describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';
import { seoPageKey } from '@/lib/content/globals-seo';

import { businessNode } from './json-ld';
import { pageMetadata } from './metadata';
import { PUBLIC_PAGE_IDS, type PublicPageId } from './public-pages';
import { robotsFor, siteEnvFrom } from './robots';

// With no SEO rows saved the public output is the registry defaults (title through the
// "%s | <site name>" template, home absolute). Pinned so a default copy change is deliberate.
const SITE = 'Vantage Autobody';
const TODAY: Record<PublicPageId, { title: string; description: string; canonical: string }> = {
  home: {
    title: `${SITE} — Crash Repair & Car Restoration in Dublin`,
    description:
      'Crash repair, chassis reconstruction, laser alignment and vehicle restoration in Dublin, by OEM-certified technicians. Insurer approved, with free quotes.',
    canonical: '/',
  },
  services: {
    title: `Car Body Repair Services in Dublin | ${SITE}`,
    description:
      'Collision repair, resprays, laser chassis alignment and restoration in Dublin, using OEM-approved methods. Get a free, no-obligation quote.',
    canonical: '/services',
  },
  'our-work': {
    title: `Crash Repair Before & After Gallery | ${SITE}`,
    description:
      'Before and after photos of our crash repairs, resprays and restorations in Dublin: factory panel gaps and colour matches you cannot tell apart.',
    canonical: '/our-work',
  },
  insurance: {
    title: `Insurance Claim Car Repairs in Dublin | ${SITE}`,
    description:
      'Accident repairs coordinated with your insurer: we deal with the assessors and the paperwork, and repair your car to factory standard in Dublin.',
    canonical: '/insurance',
  },
  about: {
    title: `About Our Dublin Body Shop | ${SITE}`,
    description:
      'Founded in 1998, our Dublin body shop treats collision repair as a precision craft, with OEM-certified technicians and insurer-approved repairs.',
    canonical: '/about',
  },
  process: {
    title: `Our Car Body Repair Process | ${SITE}`,
    description:
      'From digital triage to a multi-point handoff inspection, every step of your car body repair is logged and shared with you. See how we work.',
    canonical: '/process',
  },
  contact: {
    title: `Contact Our Dublin Body Shop | ${SITE}`,
    description:
      'Call, message or visit our Dublin body shop. Book an inspection for a precise repair estimate, or ask our technicians a question.',
    canonical: '/contact',
  },
  'get-a-quote': {
    title: `Get a Free Car Repair Quote | ${SITE}`,
    description:
      'Send your vehicle details and photos for an accurate, no-obligation car body repair quote from our Dublin technicians.',
    canonical: '/get-a-quote',
  },
};

describe('default (no SEO rows) output', () => {
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
