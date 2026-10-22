import type { BreadcrumbList, Graph, LocalBusiness, Thing, WebSite } from 'schema-dts';

import type { GlobalValue } from '@/lib/content/globals';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const abs = (origin: string, path: string) => (path === '/' ? origin : `${origin}${path}`);

// < > & and the line separators are escaped, so no string can end the script element; the result
// is still valid JSON (and JavaScript).
const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => ESCAPES[c]!);
}

export const graph = (nodes: Thing[]): Graph => ({
  '@context': 'https://schema.org',
  '@graph': nodes,
});

// No SearchAction: the site has no search.
export function websiteNode({ origin, siteName }: { origin: string; siteName: string }): WebSite {
  return {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: siteName,
    url: origin,
    inLanguage: 'en-IE',
    publisher: { '@id': `${origin}/#organization` },
  };
}

export function businessNode(i: {
  origin: string;
  site: GlobalValue<'site'>;
  contact: GlobalValue<'contact'>;
  seo: GlobalValue<'seo'>;
  logoUrl?: string | null;
}): LocalBusiness {
  const { address, phone, hours } = i.contact;
  const sameAs = [...i.seo.business.sameAs, ...i.site.social.map((s) => s.url)];
  return {
    '@type': i.seo.business.type,
    '@id': `${i.origin}/#organization`,
    name: i.site.name,
    ...(i.site.legalName ? { legalName: i.site.legalName } : {}),
    url: i.origin,
    ...(i.logoUrl ? { logo: i.logoUrl } : {}),
    ...(phone.e164 ? { telephone: phone.e164 } : {}),
    ...(i.contact.email ? { email: i.contact.email } : {}),
    ...(i.seo.business.priceRange ? { priceRange: i.seo.business.priceRange } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(address.city || address.lines.length
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(address.lines.length ? { streetAddress: address.lines.join(', ') } : {}),
            ...(address.city ? { addressLocality: address.city } : {}),
            ...(address.eircode ? { postalCode: address.eircode } : {}),
            ...(address.country ? { addressCountry: address.country } : {}),
          },
        }
      : {}),
    ...(hours.weekly.length
      ? {
          openingHoursSpecification: hours.weekly.map((h) => ({
            '@type': 'OpeningHoursSpecification' as const,
            dayOfWeek: h.days.map((d) => DAYS[d - 1]!),
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
  } as LocalBusiness;
}

export function breadcrumbNode(origin: string, trail: { name: string; path: string }[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: abs(origin, step.path),
    })),
  };
}
