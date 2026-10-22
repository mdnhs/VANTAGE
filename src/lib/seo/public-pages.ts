// The eight public pages are code routes, not CMS rows, so this registry is the one list the
// SEO area (overview, per-page tab, checks, sitemap, proxy) works from. Isomorphic: no server imports.
// Titles and descriptions equal each page's own `metadata` today (public-pages.test.ts reads the
// page sources to keep them honest).

export const HOME_DESCRIPTION =
  'Ireland’s premier automotive crash repair, precision chassis reconstruction, laser alignment, and high-end vehicle restoration center in Dublin. OEM certified and insurer approved.';

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

export type PublicPage = {
  id: PublicPageId;
  path: string;
  label: string;
  // Today's `<title>` (before the site template) and meta description.
  title: string;
  description: string;
  // Where the page's copy is edited; with `editorTab` the SEO tab lives there (`?tab=seo`),
  // otherwise `editor` is the standalone /dashboard/seo/pages/<id> screen.
  editor: string;
  editorTab: boolean;
  // Every page renders exactly one <h1> (checked in the browser exit check).
  hasH1: true;
  // Distinct internal hrefs rendered by the page body, counted from the component source: the
  // page's own components plus the closing CTA band the marketing layout renders after it
  // (StitchCta -> "/#estimator"); the header and footer are excluded. Hrefs are resolved against
  // the page's own path, so "#estimator" on the home page and "/#estimator" are one link.
  // Per page: home /our-work, /#estimator, /#work (3); services /get-a-quote, /process,
  // /#estimator (3); our-work /#estimator (1); insurance /get-a-quote, /#estimator (2);
  // about /#estimator (1); process /get-a-quote, /services, /#estimator (3);
  // contact /#estimator (1); get-a-quote /#estimator (1).
  codeLinks: number;
};

export const PUBLIC_PAGES: Record<PublicPageId, PublicPage> = {
  home: {
    id: 'home',
    path: '/',
    label: 'Home page',
    title: 'Precision Crash Repair & Restoration Dublin',
    description: HOME_DESCRIPTION,
    editor: '/dashboard/home-page',
    editorTab: true,
    hasH1: true,
    codeLinks: 3,
  },
  services: {
    id: 'services',
    path: '/services',
    label: 'Services page',
    title: 'Services',
    description:
      'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.',
    editor: '/dashboard/services',
    editorTab: true,
    hasH1: true,
    codeLinks: 3,
  },
  'our-work': {
    id: 'our-work',
    path: '/our-work',
    label: 'Our work page',
    title: 'Our Work',
    description:
      'Explore a curated selection of our most challenging and rewarding restoration projects. Precision engineering meets master craftsmanship.',
    editor: '/dashboard/projects',
    editorTab: true,
    hasH1: true,
    codeLinks: 1,
  },
  insurance: {
    id: 'insurance',
    path: '/insurance',
    label: 'Insurance page',
    title: 'Insurance Support',
    description:
      'We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road while our dedicated specialists coordinate seamlessly with your insurance provider.',
    editor: '/dashboard/insurance',
    editorTab: true,
    hasH1: true,
    codeLinks: 2,
  },
  about: {
    id: 'about',
    path: '/about',
    label: 'About page',
    title: 'About',
    description:
      "Founded in 1998, Vantage Autobody has evolved into Ireland's premier high-end collision and repair facility.",
    editor: '/dashboard/about',
    editorTab: true,
    hasH1: true,
    codeLinks: 1,
  },
  process: {
    id: 'process',
    path: '/process',
    label: 'Process page',
    title: 'Our Process',
    description:
      'From initial digital triage to strict multi-point handoff inspection, the Vantage repair standard is transparently logged every time.',
    editor: '/dashboard/process-page',
    editorTab: true,
    hasH1: true,
    codeLinks: 3,
  },
  contact: {
    id: 'contact',
    path: '/contact',
    label: 'Contact page',
    title: 'Contact',
    description:
      'We provide precise estimates based on detailed inspections. Reach out to schedule an appointment or ask technical questions.',
    editor: '/dashboard/seo/pages/contact',
    editorTab: false,
    hasH1: true,
    codeLinks: 1,
  },
  'get-a-quote': {
    id: 'get-a-quote',
    path: '/get-a-quote',
    label: 'Get a quote page',
    title: 'Get a Free Quote',
    description:
      'Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation estimate from our master technicians.',
    editor: '/dashboard/seo/pages/get-a-quote',
    editorTab: false,
    hasH1: true,
    codeLinks: 1,
  },
};

export const PUBLIC_PAGE_LIST: readonly PublicPage[] = PUBLIC_PAGE_IDS.map((id) => PUBLIC_PAGES[id]);

// Paths served by a code page; a redirect source may not shadow one, and the proxy skips them.
export const LIVE_PATHS: readonly string[] = PUBLIC_PAGE_LIST.map((p) => p.path);

// First path segments owned by the app itself (admin, auth, API, assets, generated files).
const RESERVED_SEGMENTS = new Set([
  'dashboard',
  'api',
  'login',
  'forgot-password',
  'reset-password',
  'two-factor',
  'two-factor-setup',
  'account',
  'unauthorized',
  'maintenance',
  'assets',
  'fonts',
  'uploads',
  '_next',
  'og',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
]);

export function isReservedPath(path: string): boolean {
  const segment = path.split(/[?#]/, 1)[0]!.split('/')[1] ?? '';
  return RESERVED_SEGMENTS.has(segment);
}

export function isPublicPageId(value: string): value is PublicPageId {
  return (PUBLIC_PAGE_IDS as readonly string[]).includes(value);
}

// Where the admin goes to fix a page's SEO.
export function seoFixHref(id: PublicPageId): string {
  const page = PUBLIC_PAGES[id];
  return page.editorTab ? `${page.editor}?tab=seo` : page.editor;
}
