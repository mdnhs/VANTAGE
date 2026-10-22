import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

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

const dashboardRoutes = pageFiles(APP_DIR)
  .map(routeOf)
  .filter((r) => r === '/dashboard' || r.startsWith('/dashboard/'));

describe('permissionFor', () => {
  it('finds the dashboard pages (guards the glob itself)', () => {
    expect(dashboardRoutes.length).toBeGreaterThanOrEqual(28);
  });

  it.each(dashboardRoutes)('maps %s to a permission', (route) => {
    expect(Object.keys(permissionFor(route)).length).toBeGreaterThan(0);
  });

  it('maps representative routes to MK-style permissions', () => {
    expect(permissionFor('/dashboard')).toEqual({ dashboard: ['view'] });
    expect(permissionFor('/dashboard/quotes/q1')).toEqual({ quote: ['read'] });
    expect(permissionFor('/dashboard/contacts')).toEqual({ contact: ['read'] });
    expect(permissionFor('/dashboard/settings')).toEqual({ settings: ['read'] });
    expect(permissionFor('/dashboard/home-page')).toEqual({ page: ['read'] });
    expect(permissionFor('/dashboard/services')).toEqual({ content: ['read'] });
    expect(permissionFor('/dashboard/services/create')).toEqual({ content: ['create'] });
    expect(permissionFor('/dashboard/services/s1/edit')).toEqual({ content: ['update'] });
    expect(permissionFor('/dashboard/admins')).toEqual({ user: ['list'] });
    expect(permissionFor('/dashboard/admins/create')).toEqual({ user: ['create'] });
    expect(permissionFor('/dashboard/admins/u1/edit')).toEqual({ user: ['update'] });
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
