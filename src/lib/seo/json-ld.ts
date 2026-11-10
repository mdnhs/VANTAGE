import type {
  BreadcrumbList,
  CreativeWork,
  FAQPage,
  Graph,
  LocalBusiness,
  Person,
  Service,
  Thing,
  WebSite,
} from 'schema-dts';

import type { GlobalValue } from '@/lib/content/globals';
import { siteNameFrom } from '@/lib/content/site-name';

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
    name: siteNameFrom(siteName),
    url: origin,
    inLanguage: 'en-IE',
    publisher: { '@id': `${origin}/#organization` },
  };
}

// Admin-typed numbers: a blank or out-of-range value leaves the whole property out.
const numberOf = (v: string) => (v.trim() === '' ? NaN : Number(v));

function geoOf(lat: string, lng: string) {
  const latitude = numberOf(lat);
  const longitude = numberOf(lng);
  const ok = Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  return ok ? { '@type': 'GeoCoordinates' as const, latitude, longitude } : null;
}

// Google rejects a rating without a count, so both are required.
function ratingOf(value: string, count: string) {
  const ratingValue = numberOf(value);
  const reviewCount = numberOf(count);
  const ok = ratingValue >= 1 && ratingValue <= 5 && Number.isInteger(reviewCount) && reviewCount >= 1;
  return ok ? { '@type': 'AggregateRating' as const, ratingValue, reviewCount, bestRating: 5 } : null;
}

export function businessNode(i: {
  origin: string;
  site: GlobalValue<'site'>;
  contact: GlobalValue<'contact'>;
  seo: GlobalValue<'seo'>;
  logoUrl?: string | null;
  imageUrl?: string | null;
}): LocalBusiness {
  const { address, phone, hours } = i.contact;
  const { areaServed } = i.seo.business;
  const geo = geoOf(i.seo.business.latitude, i.seo.business.longitude);
  const rating = ratingOf(i.seo.business.ratingValue, i.seo.business.reviewCount);
  const sameAs = [...new Set([...i.seo.business.sameAs, ...i.site.social.map((s) => s.url)])];
  return {
    '@type': i.seo.business.type,
    '@id': `${i.origin}/#organization`,
    name: siteNameFrom(i.site.name),
    ...(i.site.legalName ? { legalName: i.site.legalName } : {}),
    url: i.origin,
    ...(i.logoUrl ? { logo: i.logoUrl } : {}),
    ...(i.imageUrl ? { image: i.imageUrl } : {}),
    ...(phone.e164 ? { telephone: phone.e164 } : {}),
    ...(i.contact.email ? { email: i.contact.email } : {}),
    ...(i.seo.business.priceRange ? { priceRange: i.seo.business.priceRange } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(areaServed.length ? { areaServed: areaServed.map((name) => ({ '@type': 'City' as const, name })) } : {}),
    ...(geo ? { geo } : {}),
    ...(rating ? { aggregateRating: rating } : {}),
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

// The team shown on the About page, each tied to the business node by its @id.
export function teamNodes(origin: string, members: { name: string; role: string }[]): Person[] {
  return members
    .filter((m) => m.name.trim())
    .map((m) => ({
      '@type': 'Person',
      name: m.name,
      ...(m.role.trim() ? { jobTitle: m.role } : {}),
      worksFor: { '@id': `${origin}/#organization` },
    }));
}

// One service on its own page, offered by the business; a starting price becomes a minimum-price offer.
export function serviceNode(i: {
  origin: string;
  path: string;
  name: string;
  description: string;
  image?: string | null;
  areaServed?: string | null;
  startingPrice?: number | null;
}): Service {
  const url = abs(i.origin, i.path);
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: i.name,
    description: i.description,
    url,
    provider: { '@id': `${i.origin}/#organization` },
    ...(i.image ? { image: i.image } : {}),
    ...(i.areaServed ? { areaServed: { '@type': 'City', name: i.areaServed } } : {}),
    ...(i.startingPrice != null
      ? {
          offers: {
            '@type': 'Offer',
            priceSpecification: { '@type': 'PriceSpecification', minPrice: i.startingPrice, priceCurrency: 'EUR' },
          },
        }
      : {}),
  };
}

// One finished job on its own project page, made by the business.
export function projectNode(i: {
  origin: string;
  path: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  dateModified?: string | null;
}): CreativeWork {
  const url = abs(i.origin, i.path);
  return {
    '@type': 'CreativeWork',
    '@id': `${url}#project`,
    name: i.name,
    description: i.description,
    url,
    creator: { '@id': `${i.origin}/#organization` },
    ...(i.imageUrl ? { image: i.imageUrl } : {}),
    ...(i.dateModified ? { dateModified: i.dateModified } : {}),
  };
}
