import type { BreadcrumbList, FAQPage, Graph, LocalBusiness, Thing, WebSite } from 'schema-dts';

import type { GlobalValue } from '@/lib/content/globals';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const abs = (origin: string, path: string) => (path === '/' ? origin : `${origin}${path}`);

// One implementation: < > & and the line separators are escaped, so no string can end the script element.
export { scriptJson } from '@/lib/tracking/script-json';

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
  const sameAs = [...new Set([...i.seo.business.sameAs, ...i.site.social.map((s) => s.url)])];
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

// Mirrors a visible FAQ section; Google ignores FAQ markup whose answers are not on the page.
export function faqNode(items: { question: string; answer: string }[]): FAQPage {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
