import { describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

import { breadcrumbNode, businessNode, graph, scriptJson, websiteNode } from './json-ld';

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
