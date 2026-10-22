import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbNode, businessNode, graph, websiteNode } from '@/lib/seo/json-ld';
import { PUBLIC_PAGES, type PublicPageId } from '@/lib/seo/public-pages';
import { resolveImageRef } from '@/server/queries/get-page-seo';
import { getSetting } from '@/server/queries/get-setting';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

// Home: WebSite + business. Every other public page: Home > page breadcrumb.
export async function PageJsonLd({ id }: { id: PublicPageId }) {
  if (id !== 'home') {
    const page = PUBLIC_PAGES[id];
    return (
      <JsonLd
        schema={graph([
          breadcrumbNode(APP_URL, [
            { name: 'Home', path: '/' },
            { name: page.title, path: page.path },
          ]),
        ])}
      />
    );
  }
  const [site, contact, seo] = await Promise.all([getSetting('site'), getSetting('contact'), getSetting('seo')]);
  const logo = await resolveImageRef(site.logo);
  const logoUrl = logo ? (logo.src.startsWith('/') ? `${APP_URL}${logo.src}` : logo.src) : null;
  return (
    <JsonLd
      schema={graph([
        websiteNode({ origin: APP_URL, siteName: site.name }),
        businessNode({ origin: APP_URL, site, contact, seo, logoUrl }),
      ])}
    />
  );
}
