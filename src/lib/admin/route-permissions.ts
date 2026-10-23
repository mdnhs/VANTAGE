import type { Permissions } from '@/lib/auth/permissions';

import { EXTRA_LINKS, HELP_LINK, NAV } from './nav';

// Dashboard route -> the permission a role needs to open it. Page-level gate
// (layer 2): the API authorises every call on its own. "[id]" matches any one
// segment. Base pages come from the nav registry (so a link is listed exactly
// when its page opens, including pages that land in later phases); record
// screens (create / edit / detail) are pattern rows below.
const REGISTRY_ROUTES: ReadonlyArray<readonly [pattern: string, permissions: Permissions]> = [
  ...NAV.flatMap((item) =>
    // A section's own href is its first child's page; the child carries the gate.
    item.children
      ? item.children.map((child): readonly [string, Permissions] => [child.href, child.permission])
      : [[item.href, item.permission as Permissions] as const],
  ),
  [HELP_LINK.href, HELP_LINK.permission],
  ...EXTRA_LINKS.map((link): readonly [string, Permissions] => [link.href, link.permission]),
];

const ROUTES: ReadonlyArray<readonly [pattern: string, permissions: Permissions]> = [
  ...REGISTRY_ROUTES,

  // The settings index forwards to the first child the role may open. Every role
  // holding settings.read also holds globals.read, so the second grant is the
  // exact "may open any settings page" gate (the section itself is any-of).
  ['/dashboard/settings', { globals: ['read'] }],

  ['/dashboard/quotes/[id]', { quote: ['read'] }],
  ['/dashboard/contacts/[id]', { contact: ['read'] }],
  ['/dashboard/seo/pages/[id]', { seo: ['read'] }],

  // Content records: list / create / edit.
  ...(
    [
      'services',
      'projects',
      'testimonials',
      'partner-logos',
      'homepage-pillars',
      'homepage-catalogs',
      'homepage-process-steps',
    ] as const
  ).flatMap((name): Array<readonly [string, Permissions]> => [
    [`/dashboard/${name}`, { content: ['read'] }],
    [`/dashboard/${name}/create`, { content: ['create'] }],
    [`/dashboard/${name}/[id]/edit`, { content: ['update'] }],
  ]),
];

const segmentsOf = (path: string) => path.split('/').filter(Boolean);

function matches(pattern: string, path: string): boolean {
  const want = segmentsOf(pattern);
  const have = segmentsOf(path);
  return want.length === have.length && want.every((s, i) => s === '[id]' || s === have[i]);
}

export function permissionFor(path: string): Permissions {
  const clean = path.split(/[?#]/)[0] ?? '';
  const hit = ROUTES.find(([pattern]) => matches(pattern, clean));
  if (!hit) throw new Error(`No permission mapped for route ${clean}`);
  // Copy so callers can never mutate the table.
  return structuredClone(hit[1]);
}
