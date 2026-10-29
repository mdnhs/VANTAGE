import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

const site = vi.hoisted(() => ({ name: 'Vantage Autobody' }));

vi.mock('@/server/queries/get-setting', () => ({
  getSetting: async (key: string) => {
    const value = parseGlobal(key as 'site', key === 'site' ? { name: site.name } : {});
    return value;
  },
}));

import { PageJsonLd } from './page-json-ld';

async function scripts(id: Parameters<typeof PageJsonLd>[0]['id']) {
  const html = renderToStaticMarkup(await PageJsonLd({ id }));
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => m[1]!);
}

describe('PageJsonLd', () => {
  it('home renders one graph with the website and the business', async () => {
    const found = await scripts('home');
    expect(found).toHaveLength(1);
    const types = (JSON.parse(found[0]!) as { '@graph': { '@type': string }[] })['@graph'].map((n) => n['@type']);
    expect(types).toEqual(['WebSite', 'AutoBodyShop']);
  });

  it('other pages render a two-step breadcrumb', async () => {
    const graph = JSON.parse((await scripts('process'))[0]!) as {
      '@graph': { '@type': string; itemListElement: unknown[] }[];
    };
    expect(graph['@graph'].map((n) => n['@type'])).toEqual(['BreadcrumbList']);
    expect(graph['@graph'][0]!.itemListElement).toHaveLength(2);
  });

  it('contact adds the business and about adds the team', async () => {
    const types = async (id: 'contact' | 'about') =>
      (JSON.parse((await scripts(id))[0]!) as { '@graph': { '@type': string }[] })['@graph'].map((n) => n['@type']);
    expect(await types('contact')).toEqual(['BreadcrumbList', 'AutoBodyShop']);
    expect((await types('about')).filter((t) => t === 'Person').length).toBeGreaterThan(0);
  });

  it('escapes a script-closing site name', async () => {
    site.name = 'Evil</script><script>alert(1)</script>';
    const found = await scripts('home');
    expect(found).toHaveLength(1);
    expect(found[0]).not.toContain('<');
    expect(JSON.stringify(JSON.parse(found[0]!))).toContain('</script>');
    site.name = 'Vantage Autobody';
  });
});
