import { describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';
import { seoPageKey } from '@/lib/content/globals-seo';
import type { PublicImage } from '@/lib/media/public-image';

import { detailPageMetadata, pageDescription, pageMetadata, rootMetadata } from './metadata';
import { HOME_DESCRIPTION, PUBLIC_PAGE_IDS, PUBLIC_PAGES, type PublicPageId } from './public-pages';

const defaults = () => parseGlobal('seo', {});
const input = (id: PublicPageId, over: Record<string, unknown> = {}, d = defaults()) => ({
  id,
  seo: parseGlobal(seoPageKey(id), over),
  defaults: d,
  siteName: 'Vantage Autobody',
  ogImage: null,
});

const image: PublicImage = {
  id: 'm1',
  src: 'https://cdn.x.ie/a.jpg',
  mimeType: 'image/jpeg',
  width: 1600,
  height: 840,
  alt: 'A car',
  blurDataUrl: null,
  focal: { x: 0.5, y: 0.5 },
};

describe('pageMetadata default state', () => {
  for (const id of PUBLIC_PAGE_IDS.filter((p) => p !== 'home')) {
    it(`${id} reproduces today's output`, () => {
      const page = PUBLIC_PAGES[id];
      const m = pageMetadata(input(id));
      expect(m.title).toEqual({ absolute: `${page.title} | Vantage Autobody` });
      expect(m.description).toBe(page.description);
      expect(m.alternates?.canonical).toBe(page.path);
      expect(m.openGraph?.images).toEqual([
        { url: `/og/${id}`, width: 1200, height: 630, alt: `${page.title} | Vantage Autobody` },
      ]);
      expect(m.robots).toBeUndefined();
    });
  }

  it('home title and description', () => {
    const m = pageMetadata(input('home'));
    expect(m.title).toEqual({ absolute: 'Vantage Autobody — Crash Repair & Car Restoration in Dublin' });
    expect(m.description).toBe(HOME_DESCRIPTION);
  });
});

describe('pageMetadata generated card', () => {
  it('points the share image at the per-page card', () => {
    const m = pageMetadata(input('about'));
    expect(m.openGraph?.images).toEqual([expect.objectContaining({ url: '/og/about', width: 1200, height: 630 })]);
    expect(m.twitter?.images).toEqual(['/og/about']);
  });
});

describe('pageDescription', () => {
  it('home uses the site default description when set', () => {
    const d = defaults();
    d.defaultDescription = 'Site wide text';
    expect(pageDescription(input('home', {}, d))).toBe('Site wide text');
  });
  it('other pages ignore the site default description', () => {
    const d = defaults();
    d.defaultDescription = 'Site wide text';
    expect(pageDescription(input('about', {}, d))).toBe(PUBLIC_PAGES.about.description);
  });
  it('own description wins', () => {
    expect(pageDescription(input('about', { description: 'Mine' }))).toBe('Mine');
  });
});

describe('pageMetadata overrides', () => {
  it('canonical wins', () => {
    const m = pageMetadata(input('about', { canonical: 'https://x.ie/a' }));
    expect(m.alternates?.canonical).toBe('https://x.ie/a');
    expect(m.openGraph).toMatchObject({ url: 'https://x.ie/a' });
  });

  it('page noindex keeps links followable', () => {
    expect(pageMetadata(input('about', { noindex: true })).robots).toEqual({ index: false, follow: true });
  });

  it('site noindex blocks following too', () => {
    const d = defaults();
    d.robots = 'noindex';
    expect(pageMetadata(input('about', {}, d)).robots).toEqual({ index: false, follow: false });
  });

  it('uses the share image it is given', () => {
    const m = pageMetadata({ ...input('about'), ogImage: image });
    expect(m.openGraph?.images).toEqual([{ url: image.src, width: 1600, height: 840, alt: 'A car' }]);
    expect(m.twitter).toMatchObject({ images: [image.src] });
  });

  it('social fields and card type', () => {
    const d = defaults();
    d.twitterHandle = '@vantage';
    const m = pageMetadata(input('about', { ogTitle: 'Social', ogDescription: 'Soc desc', twitterCard: 'summary' }, d));
    expect(m.openGraph).toMatchObject({ title: 'Social', description: 'Soc desc' });
    expect(m.twitter).toMatchObject({ card: 'summary', site: '@vantage', title: 'Social', description: 'Soc desc' });
  });
});

describe('rootMetadata', () => {
  const base = {
    appUrl: 'https://x.ie',
    seo: defaults(),
    siteName: 'Vantage Autobody',
    hoursSummary: 'Mon–Fri: 8:00 – 18:00',
    defaultOgImage: null,
  };

  it('equals what the root layout builds today (generated card)', () => {
    const title = 'Vantage Autobody';
    const description = 'Vantage Autobody — Mon–Fri: 8:00 – 18:00';
    expect(rootMetadata(base)).toEqual({
      metadataBase: new URL('https://x.ie'),
      title: { default: title, template: '%s | Vantage Autobody' },
      description,
      applicationName: title,
      generator: 'Next.js',
      referrer: 'origin-when-cross-origin',
      formatDetection: { email: false, address: false, telephone: false },
      alternates: { canonical: '/' },
      openGraph: {
        type: 'website',
        siteName: title,
        locale: 'en_IE',
        url: '/',
        title,
        description,
        images: [{ url: '/og', width: 1200, height: 630, alt: title }],
      },
      twitter: { card: 'summary_large_image', site: undefined, title, description, images: ['/og'] },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
      },
    });
  });

  it('uses site defaults, the template and the default share image', () => {
    const seo = defaults();
    seo.defaultTitle = 'Default';
    seo.defaultDescription = 'Desc';
    seo.titleTemplate = '%s — VA';
    seo.twitterHandle = '@v';
    const m = rootMetadata({ ...base, seo, defaultOgImage: image });
    expect(m.title).toEqual({ default: 'Default', template: '%s — VA' });
    expect(m.description).toBe('Desc');
    expect(m.openGraph?.images).toEqual([{ url: image.src, width: 1600, height: 840, alt: 'A car' }]);
    expect(m.twitter).toMatchObject({ site: '@v', images: [image.src] });
  });

  it('uses the uploaded icon as the favicon and none when there is no icon', () => {
    const icon = { ...image, src: 'https://media.x.ie/fav.png', mimeType: 'image/png' };
    expect(rootMetadata({ ...base, icon }).icons).toEqual({
      icon: [{ url: icon.src, type: 'image/png' }],
      apple: [{ url: icon.src }],
    });
    expect(rootMetadata(base).icons).toBeUndefined();
  });

  it('noindex sets plain robots', () => {
    const seo = defaults();
    seo.robots = 'noindex';
    expect(rootMetadata({ ...base, seo }).robots).toEqual({ index: false, follow: false });
  });

  it('renders verification codes', () => {
    const seo = defaults();
    seo.verification = { google: 'abc', bing: 'def' };
    expect(rootMetadata({ ...base, seo }).verification).toEqual({ google: 'abc', other: { 'msvalidate.01': 'def' } });
    expect(rootMetadata(base).verification).toBeUndefined();
  });
});

describe('detailPageMetadata', () => {
  const defaults = parseGlobal('seo', undefined);
  const blankSeo = {
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    canonical: null,
    noindex: false,
  };
  const base = {
    path: '/services/respray',
    fallbackTitle: 'Respray in Dublin',
    fallbackDescription: 'A full respray.',
    defaults,
    siteName: 'Auto Paint Shop',
    image: null,
  };

  it('falls back to the row name and text, its own address and the generated card', () => {
    const m = detailPageMetadata({ ...base, seo: blankSeo });
    expect(m.title).toEqual({ absolute: 'Respray in Dublin | Auto Paint Shop' });
    expect(m.description).toBe('A full respray.');
    expect(m.alternates?.canonical).toBe('/services/respray');
    expect(m.openGraph).toMatchObject({ url: '/services/respray', title: 'Respray in Dublin | Auto Paint Shop' });
    expect(m.robots).toBeUndefined();
  });

  it('uses the saved search and social fields, canonical and noindex', () => {
    const m = detailPageMetadata({
      ...base,
      seo: {
        seoTitle: 'Car respray Dublin',
        seoDescription: 'Respray from €400.',
        ogTitle: 'Share title',
        ogDescription: 'Share text',
        canonical: '/services',
        noindex: true,
      },
    });
    expect(m.title).toEqual({ absolute: 'Car respray Dublin | Auto Paint Shop' });
    expect(m.description).toBe('Respray from €400.');
    expect(m.alternates?.canonical).toBe('/services');
    expect(m.openGraph).toMatchObject({ url: '/services', title: 'Share title', description: 'Share text' });
    expect(m.twitter).toMatchObject({ title: 'Share title', description: 'Share text' });
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it('a site switched to noindex wins over the row', () => {
    const m = detailPageMetadata({ ...base, seo: blankSeo, defaults: { ...defaults, robots: 'noindex' } });
    expect(m.robots).toEqual({ index: false, follow: false });
  });
});
