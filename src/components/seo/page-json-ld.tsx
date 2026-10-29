import type { Thing } from 'schema-dts';

import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbNode, businessNode, graph, teamNodes, websiteNode } from '@/lib/seo/json-ld';
import { PUBLIC_PAGES, type PublicPageId } from '@/lib/seo/public-pages';
import { resolveImageRef } from '@/server/queries/get-page-seo';
import { getSetting } from '@/server/queries/get-setting';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

async function business() {
  const [site, contact, seo] = await Promise.all([getSetting('site'), getSetting('contact'), getSetting('seo')]);
  const logo = await resolveImageRef(site.logo);
  const logoUrl = logo ? (logo.src.startsWith('/') ? `${APP_URL}${logo.src}` : logo.src) : null;
  return { site, node: businessNode({ origin: APP_URL, site, contact, seo, logoUrl }) };
}

// Home: WebSite + business. Every other public page: Home > page breadcrumb; Contact adds the
// business (address, phone, hours) and About the team.
export async function PageJsonLd({ id }: { id: PublicPageId }) {
  if (id === 'home') {
    const { site, node } = await business();
    return <JsonLd schema={graph([websiteNode({ origin: APP_URL, siteName: site.name }), node])} />;
  }
  const page = PUBLIC_PAGES[id];
  const nodes: Thing[] = [
    breadcrumbNode(APP_URL, [
      { name: 'Home', path: '/' },
      { name: page.crumb, path: page.path },
    ]),
  ];
  if (id === 'contact') nodes.push((await business()).node);
  if (id === 'about') nodes.push(...teamNodes(APP_URL, (await getSetting('page.about')).team.members));
  return <JsonLd schema={graph(nodes)} />;
}
