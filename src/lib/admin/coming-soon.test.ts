import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { REAL_ROUTES, comingSoonLink, comingSoonParams, guardComingSoon } from './coming-soon';
import { EXTRA_LINKS, HELP_LINK, NAV, canOpen } from './nav';

const APP_DIR = path.join(import.meta.dirname, '../../app');
function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return pageFiles(full);
    return entry === 'page.tsx' ? [full] : [];
  });
}

describe('comingSoonLink', () => {
  it('resolves a registered section and its child page', () => {
    expect(comingSoonLink('media', [])?.label).toBe('Media');
    expect(comingSoonLink('seo', ['redirects'])?.label).toBe('Redirects');
  });
  it('returns undefined (404) for unregistered sections and deep paths', () => {
    expect(comingSoonLink('nope', [])).toBeUndefined();
    expect(comingSoonLink('seo', ['redirects', 'extra'])).toBeUndefined();
    expect(comingSoonLink('quotes', ['abc', 'zzz'])).toBeUndefined();
  });
  it('carries the permission the page must enforce', () => {
    const link = comingSoonLink('marketing', ['code'])!;
    expect(canOpen(['owner'], link.permission)).toBe(true);
    expect(canOpen(['viewer'], link.permission)).toBe(false);
  });
});

describe('comingSoonParams', () => {
  const keys = comingSoonParams().map((p) => [p.section, ...p.rest].join('/'));
  it('lists the placeholder destinations', () => {
    for (const k of [
      'media',
      'seo',
      'seo/defaults',
      'seo/redirects',
      'marketing/code',
      'appearance',
      'activity',
      'help',
    ]) {
      expect(keys).toContain(k);
    }
  });
  it('excludes the dashboard root and real routes', () => {
    expect(keys).not.toContain('');
    for (const k of ['home-page', 'services', 'quotes', 'contacts', 'settings', 'users', 'account']) {
      expect(keys).not.toContain(k);
    }
  });
  it('every excluded real route has a page file', () => {
    for (const href of REAL_ROUTES) {
      const name = href.replace('/dashboard/', '');
      const hit = pageFiles(APP_DIR).some((f) => f.includes(`${path.sep}${name}${path.sep}`));
      expect(hit, href).toBe(true);
    }
  });

  it('lists every real route folder a nav href points at in REAL_ROUTES (reverse direction)', () => {
    const dashboardDir = path.join(APP_DIR, '(main)/(protected)/(dashboard_layout)/dashboard');
    const navHrefs = new Set([
      HELP_LINK.href,
      ...EXTRA_LINKS.map((l) => l.href),
      ...NAV.flatMap((item) => [item.href, ...(item.children ?? []).map((c) => c.href)]),
    ]);
    const realPaths = pageFiles(dashboardDir)
      .map((f) =>
        path
          .relative(dashboardDir, path.dirname(f))
          .split(path.sep)
          .filter((seg) => seg && !/^\(.*\)$/.test(seg)),
      )
      .filter((segs) => segs[0] !== '[section]' && !segs.some((seg) => seg.startsWith('[')))
      .map((segs) => ['/dashboard', ...segs].join('/'));
    const missing = realPaths.filter((href) => href !== '/dashboard' && navHrefs.has(href) && !REAL_ROUTES.has(href));
    expect(missing).toEqual([]);
  });

  it('keeps the catch-all page calling guardComingSoon', () => {
    const source = readFileSync(
      path.join(APP_DIR, '(main)/(protected)/(dashboard_layout)/dashboard/[section]/[[...rest]]/page.tsx'),
      'utf8',
    );
    expect(source).toMatch(/import\s*\{[^}]*\bguardComingSoon\b[^}]*\}\s*from\s*'@\/lib\/admin\/coming-soon'/);
    expect(source).toMatch(/await\s+guardComingSoon\(/);
  });
});

describe('guardComingSoon', () => {
  const make = () => ({
    requireActor: vi.fn(async () => {}),
    requirePermission: vi.fn(async () => {}),
    notFound: vi.fn((): never => {
      throw new Error('NOT_FOUND');
    }),
  });
  it('requires the actor, then the link permission with the path', async () => {
    const g = make();
    const link = await guardComingSoon('marketing', ['code'], g);
    expect(g.requireActor).toHaveBeenCalledWith('/dashboard/marketing/code');
    expect(g.requirePermission).toHaveBeenCalledWith(link.permission, '/dashboard/marketing/code');
    expect(link.permission).toEqual({ code: ['update'] });
  });
  it('404s an unregistered path after the sign-in check, without a permission check', async () => {
    const g = make();
    await expect(guardComingSoon('nope', [], g)).rejects.toThrow('NOT_FOUND');
    expect(g.requireActor).toHaveBeenCalled();
    expect(g.requirePermission).not.toHaveBeenCalled();
  });
});
