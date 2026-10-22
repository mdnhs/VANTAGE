import { hasPermission, type Permissions, type RoleName } from '@/lib/auth/permissions';
import { SETTINGS_PAGE_LABELS, type SettingsPage } from '@/lib/content/global-access';

// One isomorphic registry (no React) feeds the sidebar, the command palette and
// the page guard (`permissionFor`), so a link is listed exactly when its page
// opens. Icons live in components/admin/shell/nav-icons.ts.
export type NavGroupId = 'menu' | 'growth' | 'general';

export type NavLink = {
  id: string;
  label: string;
  href: string;
  permission: Permissions;
  keywords?: readonly string[];
  // Extra path prefixes that count as "inside" this link (e.g. the record
  // screens of a content type shown under one tab).
  match?: readonly string[];
};

export type NavItem = Omit<NavLink, 'permission'> & {
  // A section may open for any one of several permissions.
  permission: Permissions | readonly Permissions[];
  group: NavGroupId;
  children?: readonly NavLink[];
  badge?: 'new-leads';
  // Drawn as an icon button in the sidebar footer dock, not in the menu.
  dock?: true;
};

export type Destination = NavLink & { parent: string | null };

export const NAV_GROUPS: readonly { id: NavGroupId; label: string }[] = [
  { id: 'menu', label: 'Menu' },
  { id: 'growth', label: 'Growth' },
  { id: 'general', label: 'General' },
];

// A /dashboard/settings/<slug> page; the label comes from the globals layer so
// the sidebar, the page title and the editor never drift.
function settingsLink(slug: SettingsPage, permission: Permissions, keywords: readonly string[]): NavLink {
  return {
    id: `settings-${slug}`,
    label: SETTINGS_PAGE_LABELS[slug],
    href: `/dashboard/settings/${slug}`,
    permission,
    keywords,
  };
}

export const NAV: readonly NavItem[] = [
  {
    id: 'dashboard',
    group: 'menu',
    label: 'Dashboard',
    href: '/dashboard',
    permission: { dashboard: ['view'] },
    keywords: ['home', 'overview'],
  },
  {
    id: 'website',
    group: 'menu',
    label: 'Website',
    href: '/dashboard/home-page',
    permission: { page: ['read'] },
    keywords: ['pages', 'content', 'homepage'],
    children: [
      {
        id: 'website-home',
        label: 'Home page',
        href: '/dashboard/home-page',
        permission: { page: ['read'] },
        keywords: ['homepage', 'pillars', 'catalogs', 'steps', 'testimonials', 'partners', 'logos'],
        match: [
          '/dashboard/homepage-pillars',
          '/dashboard/homepage-catalogs',
          '/dashboard/homepage-process-steps',
          '/dashboard/testimonials',
          '/dashboard/partner-logos',
        ],
      },
      {
        id: 'website-services',
        label: 'Services',
        href: '/dashboard/services',
        permission: { content: ['read'] },
        keywords: ['offer', 'plans'],
      },
      {
        id: 'website-work',
        label: 'Our work',
        href: '/dashboard/projects',
        permission: { content: ['read'] },
        keywords: ['projects', 'portfolio', 'gallery'],
      },
      {
        id: 'website-insurance',
        label: 'Insurance',
        href: '/dashboard/insurance',
        permission: { page: ['read'] },
        keywords: ['claims', 'cover'],
      },
      {
        id: 'website-about',
        label: 'About',
        href: '/dashboard/about',
        permission: { page: ['read'] },
        keywords: ['team', 'story'],
      },
      {
        id: 'website-process',
        label: 'Process',
        href: '/dashboard/process-page',
        permission: { page: ['read'] },
        keywords: ['steps', 'how it works'],
      },
    ],
  },
  {
    id: 'media',
    group: 'menu',
    label: 'Media',
    href: '/dashboard/media',
    permission: { media: ['read'] },
    keywords: ['images', 'uploads', 'library'],
  },
  {
    id: 'enquiries',
    group: 'menu',
    label: 'Enquiries',
    href: '/dashboard/quotes',
    permission: [{ quote: ['read'] }, { contact: ['read'] }],
    keywords: ['leads', 'inbox', 'messages'],
    badge: 'new-leads',
    children: [
      {
        id: 'enquiries-quotes',
        label: 'Quote requests',
        href: '/dashboard/quotes',
        permission: { quote: ['read'] },
        keywords: ['estimate', 'leads', 'kanban'],
      },
      {
        id: 'enquiries-contacts',
        label: 'Contact messages',
        href: '/dashboard/contacts',
        permission: { contact: ['read'] },
        keywords: ['inbox', 'messages', 'enquiry'],
      },
    ],
  },
  {
    id: 'seo',
    group: 'growth',
    label: 'SEO',
    href: '/dashboard/seo',
    permission: { seo: ['read'] },
    keywords: ['search', 'google', 'meta', 'sitemap'],
    children: [
      { id: 'seo-overview', label: 'Overview', href: '/dashboard/seo', permission: { seo: ['read'] } },
      {
        id: 'seo-defaults',
        label: 'Defaults',
        href: '/dashboard/seo/defaults',
        permission: { seo: ['read'] },
      },
      {
        id: 'seo-redirects',
        label: 'Redirects',
        href: '/dashboard/seo/redirects',
        permission: { redirect: ['read'] },
      },
    ],
  },
  {
    id: 'marketing',
    group: 'growth',
    label: 'Marketing',
    href: '/dashboard/marketing',
    permission: { tracking: ['read'] },
    keywords: ['analytics', 'gtm', 'ga4', 'pixel', 'tracking'],
    children: [
      {
        id: 'marketing-tracking',
        label: 'Tracking',
        href: '/dashboard/marketing',
        permission: { tracking: ['read'] },
      },
      {
        id: 'marketing-consent',
        label: 'Consent banner',
        href: '/dashboard/marketing/consent',
        permission: { tracking: ['read'] },
      },
      {
        id: 'marketing-events',
        label: 'Event catalogue',
        href: '/dashboard/marketing/events',
        permission: { tracking: ['read'] },
      },
      {
        id: 'marketing-code',
        label: 'Custom code',
        href: '/dashboard/marketing/code',
        permission: { code: ['update'] },
      },
    ],
  },
  {
    id: 'appearance',
    group: 'general',
    label: 'Appearance',
    href: '/dashboard/appearance',
    permission: { appearance: ['read'] },
    keywords: ['theme', 'colours', 'colors', 'brand', 'logo'],
  },
  {
    id: 'settings',
    group: 'general',
    label: 'Site settings',
    href: '/dashboard/settings',
    // Opens for either grant: each child carries its own (identity, notifications
    // and privacy need settings.read; the rest globals.read).
    permission: [{ settings: ['read'] }, { globals: ['read'] }],
    keywords: ['identity', 'contact', 'footer', 'navigation', 'privacy'],
    children: [
      settingsLink('identity', { settings: ['read'] }, ['logo', 'favicon', 'name', 'social']),
      settingsLink('contact', { globals: ['read'] }, ['phone', 'email', 'address', 'hours', 'map']),
      settingsLink('navigation', { globals: ['read'] }, ['menu', 'header', 'links']),
      settingsLink('footer', { globals: ['read'] }, ['links', 'legal', 'copyright']),
      settingsLink('forms', { globals: ['read'] }, ['quote form', 'contact form', 'microcopy', 'labels']),
      settingsLink('notifications', { settings: ['read'] }, ['email', 'auto-reply', 'recipients']),
      settingsLink('privacy', { settings: ['read'] }, ['retention', 'gdpr', 'spam']),
    ],
  },
  {
    id: 'users',
    group: 'general',
    label: 'Users & roles',
    href: '/dashboard/users',
    permission: { user: ['list'] },
    dock: true,
    keywords: ['team', 'invite', 'people', 'permissions'],
  },
  {
    id: 'activity',
    group: 'general',
    label: 'Activity log',
    href: '/dashboard/activity',
    permission: { audit: ['read'] },
    dock: true,
    keywords: ['audit', 'history', 'changes'],
  },
];

// In the footer dock with "Log out", outside the gated navigation.
export const HELP_LINK: NavLink = {
  id: 'help',
  label: 'Help',
  href: '/dashboard/help',
  permission: { dashboard: ['view'] },
  keywords: ['support', 'guide', 'how to'],
};

// Not in the sidebar: reached from the user menu and the command palette.
export const EXTRA_LINKS: readonly NavLink[] = [
  {
    id: 'account',
    label: 'Account',
    href: '/dashboard/account',
    permission: { dashboard: ['view'] },
    keywords: ['profile', 'password', 'sessions', 'security', 'two-factor'],
  },
];

// Single permission, or any-of for a list.
export function canOpen(roles: readonly RoleName[], permission: Permissions | readonly Permissions[]): boolean {
  const anyOf: readonly Permissions[] = Array.isArray(permission)
    ? (permission as readonly Permissions[])
    : [permission as Permissions];
  return anyOf.some((p) => hasPermission(roles, p));
}

type Allows = (permission: Permissions | readonly Permissions[]) => boolean;

// A section whose own href belongs to a child the actor cannot open (an any-of
// parent such as Enquiries) links to its first child they can.
export function visibleNavWith(allows: Allows): NavItem[] {
  return NAV.filter((item) => allows(item.permission)).map((item) => {
    if (!item.children) return item;
    const children = item.children.filter((child) => allows(child.permission));
    const own = children.some((child) => child.href === item.href);
    return { ...item, children, href: own ? item.href : (children[0]?.href ?? item.href) };
  });
}

export function visibleNav(roles: readonly RoleName[]): NavItem[] {
  return visibleNavWith((permission) => canOpen(roles, permission));
}

// Every page the actor may open, once each, labelled with its section.
export function reachableLinks(roles: readonly RoleName[]): Destination[] {
  const seen = new Set<string>();
  const out: Destination[] = [];
  const add = (link: NavLink, parent: string | null) => {
    if (seen.has(link.href)) return;
    seen.add(link.href);
    out.push({ ...link, parent });
  };
  for (const item of visibleNav(roles)) {
    if (item.children) {
      // A multi-page section is listed through its children; the parent href
      // may belong to a child the actor cannot open.
      for (const child of item.children) add(child, item.label);
    } else {
      add(item as NavLink, null);
    }
  }
  for (const link of [HELP_LINK, ...EXTRA_LINKS]) {
    if (canOpen(roles, link.permission)) add(link, null);
  }
  return out;
}

const stripQuery = (path: string) => (path.split(/[?#]/)[0] ?? '').replace(/(.)\/+$/, '$1');

// Exact match; a section's child wins over its parent when they share an href
// (the parent's permission may be any-of, the child's is the page's gate).
export function linkForPath(path: string): NavLink | undefined {
  const clean = stripQuery(path);
  for (const item of NAV) {
    const child = item.children?.find((link) => link.href === clean);
    if (child) return child;
  }
  const item = NAV.find((i) => i.href === clean && !Array.isArray(i.permission));
  if (item) return item as NavLink;
  return [HELP_LINK, ...EXTRA_LINKS].find((link) => link.href === clean);
}

const within = (pathname: string, prefix: string) =>
  prefix === '/dashboard' ? pathname === prefix : pathname === prefix || pathname.startsWith(`${prefix}/`);

const prefixesOf = (link: { href: string; match?: readonly string[] }) => [link.href, ...(link.match ?? [])];

// Longest prefix of `link` containing the path, or -1.
const depth = (pathname: string, link: { href: string; match?: readonly string[] }) =>
  Math.max(
    -1,
    ...prefixesOf(link)
      .filter((p) => within(pathname, p))
      .map((p) => p.length),
  );

// Whether the path is inside this link. Among the children of one section the
// most specific link wins, so Overview (/dashboard/seo) is not lit on /dashboard/seo/defaults.
export function isActivePath(pathname: string, link: NavLink | NavItem): boolean {
  const path = stripQuery(pathname);
  const own = depth(path, link);
  if (own < 0) {
    // A section is inside when any of its children is.
    return 'children' in link && !!link.children?.some((c) => depth(path, c) >= 0);
  }
  const owner = NAV.find((item) => item.children?.some((c) => c.id === link.id));
  if (owner?.children) {
    return !owner.children.some((sibling) => sibling.id !== link.id && depth(path, sibling) > own);
  }
  return true;
}

// The section whose sub-navigation (rail) the path belongs to: only sections
// with more than one link the actor can open.
export function activeSection(pathname: string, roles: readonly RoleName[]): NavItem | undefined {
  return visibleNav(roles).find((item) => (item.children?.length ?? 0) > 1 && isActivePath(pathname, item));
}

export function firstReachableHref(item: NavItem, roles: readonly RoleName[]): string | null {
  if (item.children) {
    return item.children.find((c) => canOpen(roles, c.permission))?.href ?? null;
  }
  return canOpen(roles, item.permission) ? item.href : null;
}
