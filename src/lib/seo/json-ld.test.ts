import { describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

import {
  breadcrumbNode,
  businessNode,
  graph,
  projectNode,
  scriptJson,
  serviceNode,
  teamNodes,
  websiteNode,
} from './json-ld';

const origin = 'https://x.ie';
const site = () => parseGlobal('site', {});
const contact = () => parseGlobal('contact', {});
const seo = () => parseGlobal('seo', {});

describe('scriptJson', () => {
  it('escapes characters that could end the script element and round-trips', () => {
    const value = { a: '</script><b>&\u2028\u2029' };
    const out = scriptJson(value);
    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(out)).toEqual(value);
  });
});

describe('websiteNode', () => {
  it('has ids, a publisher and no SearchAction', () => {
    const n = websiteNode({ origin, siteName: 'Vantage' });
    expect(n['@id']).toBe(`${origin}/#website`);
    expect(n.publisher).toEqual({ '@id': `${origin}/#organization` });
    expect(JSON.stringify(n)).not.toContain('SearchAction');
  });
});

describe('businessNode', () => {
  it('builds the default business', () => {
    const n = businessNode({ origin, site: site(), contact: contact(), seo: seo() }) as unknown as Record<
      string,
      unknown
    >;
    expect(n['@type']).toBe('AutoBodyShop');
    expect(n['@id']).toBe(`${origin}/#organization`);
    expect(n.telephone).toBe('+35312345678');
    expect(n.sameAs).toBeUndefined();
    expect(n.logo).toBeUndefined();
    expect(n.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: 'Unit 4, Industrial Estate, Dublin Road, Ireland',
    });
    expect(n.openingHoursSpecification).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
    ]);
  });

  it('merges profiles, takes the type and adds the logo', () => {
    const s = seo();
    s.business.type = 'AutoRepair';
    s.business.sameAs = ['https://a.example/p'];
    const st = site();
    st.social = [{ label: 'FB', url: 'https://b.example/p' }];
    const n = businessNode({
      origin,
      site: st,
      contact: contact(),
      seo: s,
      logoUrl: 'https://x.ie/logo.png',
    }) as unknown as Record<string, unknown>;
    expect(n['@type']).toBe('AutoRepair');
    expect(n.sameAs).toEqual(['https://a.example/p', 'https://b.example/p']);
    expect(n.logo).toBe('https://x.ie/logo.png');
  });
});

describe('businessNode admin fields', () => {
  const node = (patch: (s: ReturnType<typeof seo>) => void, imageUrl?: string | null) => {
    const s = seo();
    patch(s);
    return businessNode({ origin, site: site(), contact: contact(), seo: s, imageUrl }) as unknown as Record<
      string,
      unknown
    >;
  };

  it('emits none of the optional keys by default', () => {
    const n = node(() => {});
    for (const key of ['areaServed', 'geo', 'aggregateRating', 'image']) expect(n[key], key).toBeUndefined();
  });

  it('lists the areas served and the map position', () => {
    const n = node((s) => {
      s.business.areaServed = ['Dublin', 'Wicklow'];
      s.business.latitude = '53.3498';
      s.business.longitude = '-6.2603';
    });
    expect(n.areaServed).toEqual([
      { '@type': 'City', name: 'Dublin' },
      { '@type': 'City', name: 'Wicklow' },
    ]);
    expect(n.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 53.3498, longitude: -6.2603 });
  });

  it('ignores blank rows in the areas served', () => {
    expect(node((s) => void (s.business.areaServed = ['', '  '])).areaServed).toBeUndefined();
    expect(node((s) => void (s.business.areaServed = ['', 'Dublin'])).areaServed).toEqual([
      { '@type': 'City', name: 'Dublin' },
    ]);
  });

  it('needs both coordinates, and valid ones, for geo', () => {
    expect(node((s) => void (s.business.latitude = '53.3')).geo).toBeUndefined();
    expect(
      node((s) => {
        s.business.latitude = '95';
        s.business.longitude = '-6';
      }).geo,
    ).toBeUndefined();
    expect(
      node((s) => {
        s.business.latitude = 'north';
        s.business.longitude = '-6';
      }).geo,
    ).toBeUndefined();
  });

  it('emits a rating only with both a value from 1 to 5 and a review count', () => {
    const rated = node((s) => {
      s.business.ratingValue = '4.9';
      s.business.reviewCount = '180';
    });
    expect(rated.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.9,
      reviewCount: 180,
      bestRating: 5,
    });
    expect(node((s) => void (s.business.ratingValue = '4.9')).aggregateRating).toBeUndefined();
    expect(
      node((s) => {
        s.business.ratingValue = '9';
        s.business.reviewCount = '10';
      }).aggregateRating,
    ).toBeUndefined();
    expect(
      node((s) => {
        s.business.ratingValue = '4.5';
        s.business.reviewCount = '0';
      }).aggregateRating,
    ).toBeUndefined();
  });

  it('adds the image when one is given', () => {
    expect(node(() => {}, 'https://x.ie/shop.jpg').image).toBe('https://x.ie/shop.jpg');
  });
});

describe('projectNode', () => {
  const base = { origin, path: '/our-work/audi-rs6', name: 'Audi RS6 respray', description: 'A full respray.' };

  it('is a CreativeWork made by the business, with an absolute url', () => {
    const n = projectNode(base) as unknown as Record<string, unknown>;
    expect(n['@type']).toBe('CreativeWork');
    expect(n.url).toBe('https://x.ie/our-work/audi-rs6');
    expect(n.creator).toEqual({ '@id': `${origin}/#organization` });
    expect(n.image).toBeUndefined();
    expect(n.dateModified).toBeUndefined();
  });

  it('adds the image and the modified date when known', () => {
    const n = projectNode({ ...base, imageUrl: 'https://x.ie/a.jpg', dateModified: '2026-11-07T10:58:58.358Z' });
    expect((n as unknown as Record<string, unknown>).image).toBe('https://x.ie/a.jpg');
    expect((n as unknown as Record<string, unknown>).dateModified).toBe('2026-11-07T10:58:58.358Z');
  });
});

describe('breadcrumbNode', () => {
  it('numbers steps from 1 with absolute items', () => {
    const n = breadcrumbNode(origin, [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]);
    expect(n.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${origin}/about` },
    ]);
  });
});

describe('graph', () => {
  it('wraps nodes in a schema.org graph', () => {
    expect(graph([breadcrumbNode(origin, [])])).toMatchObject({ '@context': 'https://schema.org', '@graph': [{}] });
  });
});

describe('teamNodes', () => {
  it('skips unnamed members and links each person to the business', () => {
    const nodes = teamNodes(origin, [
      { name: 'Aoife', role: 'Painter' },
      { name: ' ', role: 'Ghost' },
      { name: 'Ciara', role: '' },
    ]) as unknown as Record<string, unknown>[];
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toEqual({
      '@type': 'Person',
      name: 'Aoife',
      jobTitle: 'Painter',
      worksFor: { '@id': `${origin}/#organization` },
    });
    expect(nodes[1]).not.toHaveProperty('jobTitle');
  });
});

describe('serviceNode', () => {
  it('links the provider and turns a starting price into a minimum-price offer', () => {
    const n = serviceNode({
      origin,
      path: '/services/respray',
      name: 'Respray',
      description: 'Full respray',
      areaServed: 'Dublin',
      startingPrice: 400,
    }) as unknown as Record<string, unknown>;
    expect(n['@id']).toBe(`${origin}/services/respray#service`);
    expect(n.provider).toEqual({ '@id': `${origin}/#organization` });
    expect(n.areaServed).toEqual({ '@type': 'City', name: 'Dublin' });
    expect(n.offers).toEqual({
      '@type': 'Offer',
      priceSpecification: { '@type': 'PriceSpecification', minPrice: 400, priceCurrency: 'EUR' },
    });
  });

  it('leaves out what is not set', () => {
    const n = serviceNode({ origin, path: '/services/x', name: 'X', description: 'Y' });
    expect(n).not.toHaveProperty('offers');
    expect(n).not.toHaveProperty('areaServed');
    expect(n).not.toHaveProperty('image');
  });
});
