import { describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

import { breadcrumbNode, businessNode, graph, scriptJson, serviceNode, teamNodes, websiteNode } from './json-ld';

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
