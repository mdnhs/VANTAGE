import { SETTINGS_PAGES } from '@/lib/content/global-access';

import { EXTRA_LINKS, HELP_LINK, NAV, linkForPath, type NavLink } from './nav';

// A sidebar destination whose page has not been built yet. Only registered
// paths resolve; anything else is a 404.
export function comingSoonLink(section: string, rest: readonly string[] = []): NavLink | undefined {
  return linkForPath(['/dashboard', section, ...rest].join('/'));
}

// Registry destinations that already have their own route folder. A real
// route wins over the catch-all, so these are not prerendered as placeholders.
export const REAL_ROUTES: ReadonlySet<string> = new Set([
  '/dashboard/home-page',
  '/dashboard/services',
  '/dashboard/projects',
  '/dashboard/insurance',
  '/dashboard/about',
  '/dashboard/process-page',
  '/dashboard/quotes',
  '/dashboard/contacts',
  '/dashboard/settings',
  // settings/[slug] serves every settings page.
  ...Object.keys(SETTINGS_PAGES).map((slug) => `/dashboard/settings/${slug}`),
  // settings/ai-assistant is its own folder (Phase 9).
  '/dashboard/settings/ai-assistant',
  '/dashboard/seo/defaults',
  '/dashboard/users',
  '/dashboard/account',
  '/dashboard/activity',
]);

export type SectionParams = { section: string; rest: string[] };

// One prerendered route per registered placeholder path. Without it the client
// router treats every [section] value as the same page and shows whichever
// placeholder it fetched first (a click on Enquiries opened Media).
export function comingSoonParams(): SectionParams[] {
  const hrefs = [
    HELP_LINK.href,
    ...EXTRA_LINKS.map((l) => l.href),
    ...NAV.flatMap((item) => [item.href, ...(item.children ?? []).map((c) => c.href)]),
  ];
  return [...new Set(hrefs)]
    .filter((href) => href !== '/dashboard' && !REAL_ROUTES.has(href))
    .map((href) => {
      const [section, ...rest] = href.replace('/dashboard/', '').split('/');
      return { section: section!, rest };
    });
}

type Guards = {
  requireActor: (next: string) => Promise<unknown>;
  requirePermission: (permission: NavLink['permission'], next: string) => Promise<unknown>;
  notFound: () => never;
};

// Signed in first, so a 404 never tells a stranger which paths exist; then the
// registry link's own permission.
export async function guardComingSoon(section: string, rest: readonly string[], guards: Guards): Promise<NavLink> {
  const path = ['/dashboard', section, ...rest].join('/');
  await guards.requireActor(path);
  const link = comingSoonLink(section, rest);
  if (!link) return guards.notFound();
  await guards.requirePermission(link.permission, path);
  return link;
}
