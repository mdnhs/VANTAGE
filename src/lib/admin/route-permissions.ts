import type { Permissions } from '@/lib/auth/permissions';

// Dashboard route -> the permission a role needs to open it. Page-level gate
// (layer 2): the API authorises every call on its own. "[id]" matches any one
// segment. Phase 3 replaces this with the nav registry.
const ROUTES: ReadonlyArray<readonly [pattern: string, permissions: Permissions]> = [
  ['/dashboard', { dashboard: ['view'] }],

  ['/dashboard/quotes', { quote: ['read'] }],
  ['/dashboard/quotes/[id]', { quote: ['read'] }],
  ['/dashboard/contacts', { contact: ['read'] }],
  ['/dashboard/contacts/[id]', { contact: ['read'] }],
  ['/dashboard/settings', { settings: ['read'] }],

  // Page copy.
  ['/dashboard/home-page', { page: ['read'] }],
  ['/dashboard/insurance', { page: ['read'] }],
  ['/dashboard/about', { page: ['read'] }],
  ['/dashboard/process-page', { page: ['read'] }],

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

  ['/dashboard/users', { user: ['list'] }],
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
