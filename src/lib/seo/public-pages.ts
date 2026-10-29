// The eight public pages are code routes, not CMS rows, so this registry is the one list the
// SEO area (overview, per-page tab, checks, sitemap, proxy) works from. Isomorphic: no server imports.
// Default titles and descriptions are keyword- and location-led and brand-neutral (default-parity.test.ts pins them).

export const HOME_DESCRIPTION =
  'Crash repair, chassis reconstruction, laser alignment and vehicle restoration in Dublin, by OEM-certified technicians. Insurer approved, with free quotes.';

export const PUBLIC_PAGE_IDS = [
  'home',
  'services',
  'our-work',
  'insurance',
  'about',
  'process',
  'contact',
  'get-a-quote',
] as const;
export type PublicPageId = (typeof PUBLIC_PAGE_IDS)[number];

export type PagePageKey =
  'page.home' | 'page.services' | 'page.our-work' | 'page.insurance' | 'page.about' | 'page.process';

export type PublicPage = {
  id: PublicPageId;
  path: string;
  label: string;
  // The default `<title>` (before the site template) and meta description; the SEO tab overrides both.
  title: string;
  // The page's short name in breadcrumbs.
  crumb: string;
  description: string;
  // Where the page's copy is edited; with `editorTab` the SEO tab lives there (`?tab=seo`),
  // otherwise `editorHref` is the standalone /dashboard/seo/pages/<id> screen.
  editorHref: string;
  editorTab: boolean;
  // The versioned `page.*` global holding the page's copy; null where there is no editor.
  pageKey: PagePageKey | null;
  // Every page renders exactly one <h1> (checked in the browser exit check).
  hasH1: true;
  // Distinct internal hrefs rendered by the page body, counted from the component source: the
  // page's own components plus the closing CTA band the marketing layout renders after it
  // (StitchCta -> "/#estimator"); the header and footer are excluded. Hrefs are resolved against
  // the page's own path, so "#estimator" on the home page and "/#estimator" are one link.
  // Every page but home also links "/" from its PageHero breadcrumb.
  // Per page: home /our-work, /#estimator, /#work (3); services /, /get-a-quote, /process,
  // /#estimator (4); our-work /, /#estimator (2); insurance /, /get-a-quote, /#estimator (3);
  // about /, /#estimator (2); process /, /get-a-quote, /services, /#estimator (4);
  // contact /, /#estimator (2); get-a-quote /, /#estimator (2).
  codeLinks: number;
};

export const PUBLIC_PAGES: Record<PublicPageId, PublicPage> = {
  home: {
    id: 'home',
    path: '/',
    label: 'Home page',
    title: 'Crash Repair & Car Restoration in Dublin',
    crumb: 'Home',
    description: HOME_DESCRIPTION,
    editorHref: '/dashboard/home-page',
    editorTab: true,
    pageKey: 'page.home',
    hasH1: true,
    codeLinks: 3,
  },
  services: {
    id: 'services',
    path: '/services',
    label: 'Services page',
    title: 'Car Body Repair Services in Dublin',
    crumb: 'Services',
    description:
      'Collision repair, resprays, laser chassis alignment and restoration in Dublin, using OEM-approved methods. Get a free, no-obligation quote.',
    editorHref: '/dashboard/services',
    editorTab: true,
    pageKey: 'page.services',
    hasH1: true,
    codeLinks: 4,
  },
  'our-work': {
    id: 'our-work',
    path: '/our-work',
    label: 'Our work page',
    title: 'Crash Repair Before & After Gallery',
    crumb: 'Our Work',
    description:
      'Before and after photos of our crash repairs, resprays and restorations in Dublin: factory panel gaps and colour matches you cannot tell apart.',
    editorHref: '/dashboard/projects',
    editorTab: true,
    pageKey: 'page.our-work',
    hasH1: true,
    codeLinks: 2,
  },
  insurance: {
    id: 'insurance',
    path: '/insurance',
    label: 'Insurance page',
    title: 'Insurance Claim Car Repairs in Dublin',
    crumb: 'Insurance',
    description:
      'Accident repairs coordinated with your insurer: we deal with the assessors and the paperwork, and repair your car to factory standard in Dublin.',
    editorHref: '/dashboard/insurance',
    editorTab: true,
    pageKey: 'page.insurance',
    hasH1: true,
    codeLinks: 3,
  },
  about: {
    id: 'about',
    path: '/about',
    label: 'About page',
    title: 'About Our Dublin Body Shop',
    crumb: 'About',
    description:
      'Founded in 1998, our Dublin body shop treats collision repair as a precision craft, with OEM-certified technicians and insurer-approved repairs.',
    editorHref: '/dashboard/about',
    editorTab: true,
    pageKey: 'page.about',
    hasH1: true,
    codeLinks: 2,
  },
  process: {
    id: 'process',
    path: '/process',
    label: 'Process page',
    title: 'Our Car Body Repair Process',
    crumb: 'Our Process',
    description:
      'From digital triage to a multi-point handoff inspection, every step of your car body repair is logged and shared with you. See how we work.',
    editorHref: '/dashboard/process-page',
    editorTab: true,
    pageKey: 'page.process',
    hasH1: true,
    codeLinks: 4,
  },
  contact: {
    id: 'contact',
    path: '/contact',
    label: 'Contact page',
    title: 'Contact Our Dublin Body Shop',
    crumb: 'Contact',
    description:
      'Call, message or visit our Dublin body shop. Book an inspection for a precise repair estimate, or ask our technicians a question.',
    editorHref: '/dashboard/seo/pages/contact',
    editorTab: false,
    pageKey: null,
    hasH1: true,
    codeLinks: 2,
  },
  'get-a-quote': {
    id: 'get-a-quote',
    path: '/get-a-quote',
    label: 'Get a quote page',
    title: 'Get a Free Car Repair Quote',
    crumb: 'Get a Quote',
    description:
      'Send your vehicle details and photos for an accurate, no-obligation car body repair quote from our Dublin technicians.',
    editorHref: '/dashboard/seo/pages/get-a-quote',
    editorTab: false,
    pageKey: null,
    hasH1: true,
    codeLinks: 2,
  },
};

export const PUBLIC_PAGE_LIST: readonly PublicPage[] = PUBLIC_PAGE_IDS.map((id) => PUBLIC_PAGES[id]);

// Paths served by a code page; a redirect source may not shadow one, and the proxy skips them.
export const LIVE_PATHS: ReadonlySet<string> = new Set(PUBLIC_PAGE_LIST.map((p) => p.path));

// Paths owned by the app itself (admin, auth, API, assets, generated files); segment-bound.
export const RESERVED_PREFIXES = [
  '/dashboard',
  '/api',
  '/_next',
  '/uploads',
  '/assets',
  '/fonts',
  '/og',
  '/brand',
  '/opengraph-image',
  '/twitter-image',
  '/login',
  '/account',
  '/forgot-password',
  '/reset-password',
  '/two-factor',
  '/two-factor-setup',
  '/unauthorized',
  '/maintenance',
] as const;

// Page URLs of the site this one replaces: /about.html, /services.php, /page.aspx ...
export const LEGACY_PAGE_EXTENSION = /\.(?:html?|php|aspx?)$/i;

export function isReservedPath(path: string): boolean {
  // Collapse leading slashes so "//dashboard" is judged as "/dashboard".
  const clean = '/' + path.split(/[?#]/, 1)[0]!.replace(/^\/+/, '');
  if (RESERVED_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))) return true;
  // Files (robots.txt, sitemap.xml, favicon.ico, any asset): a last segment with a dot, except
  // the legacy page extensions of the old site, which stay redirectable (public/ never holds one).
  const last = clean.split('/').pop()!;
  return last.includes('.') && !LEGACY_PAGE_EXTENSION.test(last);
}

export function isPublicPageId(value: string): value is PublicPageId {
  return (PUBLIC_PAGE_IDS as readonly string[]).includes(value);
}

// Where the admin goes to fix a page's SEO.
export function seoFixHref(id: PublicPageId): string {
  const page = PUBLIC_PAGES[id];
  return page.editorTab ? `${page.editorHref}?tab=seo` : page.editorHref;
}
