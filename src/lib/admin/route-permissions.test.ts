import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { SETTINGS_PAGES } from '@/lib/content/global-access';

import { NAV } from './nav';
import { permissionFor } from './route-permissions';

const APP_DIR = path.join(import.meta.dirname, '../../app');

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return pageFiles(full);
    return entry === 'page.tsx' ? [full] : [];
  });
}

// File path -> URL path: route groups "(x)" vanish, "[id]" becomes a concrete id.
function routeOf(file: string): string {
  const rel = path.relative(APP_DIR, path.dirname(file)).split(path.sep);
  const segments = rel
    .filter((s) => !(s.startsWith('(') && s.endsWith(')')))
    .map((s) => (/^\[.+\]$/.test(s) ? 'abc123' : s));
  return `/${segments.join('/')}`;
}

// These carry their own gate: no-access is open to any signed-in role, and the
// coming-soon catch-all enforces the permission of the registry link it resolves.
const SELF_GATED = [
  path.join('(main)', '(protected)', '(dashboard_layout)', 'dashboard', 'no-access', 'page.tsx'),
  path.join('(main)', '(protected)', '(dashboard_layout)', 'dashboard', '[section]', '[[...rest]]', 'page.tsx'),
  // Settings: each slug is gated by its registry link (settings.read or globals.read).
  path.join('(main)', '(protected)', '(dashboard_layout)', 'dashboard', 'settings', '[slug]', 'page.tsx'),
];

const dashboardRoutes = pageFiles(APP_DIR)
  .filter((file) => !SELF_GATED.includes(path.relative(APP_DIR, file)))
  .map(routeOf)
  .filter((r) => r === '/dashboard' || r.startsWith('/dashboard/'));

describe('permissionFor', () => {
  it('finds the dashboard pages (guards the glob itself)', () => {
    expect(dashboardRoutes.length).toBeGreaterThanOrEqual(26);
  });

  it.each(dashboardRoutes)('maps %s to a permission', (route) => {
    expect(Object.keys(permissionFor(route)).length).toBeGreaterThan(0);
  });

  it('maps representative routes to MK-style permissions', () => {
    expect(permissionFor('/dashboard')).toEqual({ dashboard: ['view'] });
    expect(permissionFor('/dashboard/quotes/q1')).toEqual({ quote: ['read'] });
    expect(permissionFor('/dashboard/contacts')).toEqual({ contact: ['read'] });
    expect(permissionFor('/dashboard/seo/pages/contact')).toEqual({ seo: ['read'] });
    expect(permissionFor('/dashboard/settings')).toEqual({ globals: ['read'] });
    expect(permissionFor('/dashboard/settings/identity')).toEqual({ settings: ['read'] });
    expect(permissionFor('/dashboard/settings/privacy')).toEqual({ settings: ['read'] });
    expect(permissionFor('/dashboard/settings/footer')).toEqual({ globals: ['read'] });
    expect(permissionFor('/dashboard/home-page')).toEqual({ page: ['read'] });
    expect(permissionFor('/dashboard/services')).toEqual({ content: ['read'] });
    expect(permissionFor('/dashboard/services/create')).toEqual({ content: ['create'] });
    expect(permissionFor('/dashboard/services/s1/edit')).toEqual({ content: ['update'] });
    expect(permissionFor('/dashboard/users')).toEqual({ user: ['list'] });
    expect(() => permissionFor('/dashboard/admins')).toThrow(/No permission mapped/);
  });

  it('resolves registry pages that have no page file yet', () => {
    expect(permissionFor('/dashboard/media')).toEqual({ media: ['read'] });
    expect(permissionFor('/dashboard/seo/redirects')).toEqual({ redirect: ['read'] });
    expect(permissionFor('/dashboard/marketing/code')).toEqual({ code: ['update'] });
    expect(permissionFor('/dashboard/appearance')).toEqual({ appearance: ['read'] });
    expect(permissionFor('/dashboard/activity')).toEqual({ audit: ['read'] });
    expect(permissionFor('/dashboard/help')).toEqual({ dashboard: ['view'] });
    expect(permissionFor('/dashboard/account')).toEqual({ dashboard: ['view'] });
  });

  it('ignores a query string and trailing slash', () => {
    expect(permissionFor('/dashboard/home-page?tab=pillars')).toEqual({ page: ['read'] });
    expect(permissionFor('/dashboard/quotes/')).toEqual({ quote: ['read'] });
  });

  it('throws for an unknown route', () => {
    expect(() => permissionFor('/dashboard/nope')).toThrow(/No permission mapped/);
    expect(() => permissionFor('/other')).toThrow();
  });
});

describe('settings pages', () => {
  const settingsItem = NAV.find((item) => item.id === 'settings')!;

  it.each(Object.keys(SETTINGS_PAGES))('settings/%s is gated by its nav child permission', (slug) => {
    const child = settingsItem.children!.find((c) => c.href === `/dashboard/settings/${slug}`);
    expect(child, slug).toBeDefined();
    expect(permissionFor(`/dashboard/settings/${slug}`)).toEqual(child!.permission);
  });

  it('settings/[slug]/page.tsx calls requirePermission', () => {
    const source = readFileSync(
      path.join(APP_DIR, '(main)/(protected)/(dashboard_layout)/dashboard/settings/[slug]/page.tsx'),
      'utf8',
    );
    expect(source).toMatch(/await\s+requirePermission\(/);
    expect(source).toMatch(/await\s+requireActor\(/);
  });
});
