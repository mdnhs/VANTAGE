import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const SRC = path.resolve(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !full.endsWith('legacy-site-settings-writes.test.ts') ? [full] : [];
  });

const FILES = sourceFiles(SRC).map((file) => ({ file: path.relative(SRC, file), text: readFileSync(file, 'utf8') }));

// Website page copy is edited through the versioned `/admin/globals/page.*` API now. The
// per-section PATCH endpoints of `/site-settings`, their client hooks and zod schemas are gone.
const DELETED_PATCH_PATHS = [
  'business-info',
  'social-links',
  'branding',
  'hero-media',
  'homepage-hero',
  'homepage-catalog',
  'services-hero',
  'our-work-hero',
  'insurance-page',
  'about-page',
  'process-page',
];

describe('legacy site-settings write path is gone', () => {
  it.each(DELETED_PATCH_PATHS)('no source references /site-settings/%s', (segment) => {
    const hits = FILES.filter(({ text }) => text.includes(`/site-settings/${segment}`)).map(({ file }) => file);
    expect(hits).toEqual([]);
  });

  it('no source references the admin read, the PATCH helpers or the old hooks', () => {
    const needles = [
      '/site-settings/admin',
      '/site-settings/seo',
      '/site-settings/contact',
      'API_ROUTES.siteSettings.admin',
      'API_ROUTES.siteSettings.update',
      'site-settings/hooks',
      'site-settings/services',
      'site-settings/types',
      'site-settings-schema',
      'fetchAdminSiteSettings',
      'siteSettingsService.getAdmin',
    ];
    const hits = FILES.flatMap(({ file, text }) => needles.filter((n) => text.includes(n)).map((n) => `${file}: ${n}`));
    expect(hits).toEqual([]);
  });

  it('the old client layer and zod schemas no longer exist', () => {
    for (const rel of [
      'features/site-settings/hooks',
      'features/site-settings/services',
      'features/site-settings/types',
      'validations/site-settings-schema.ts',
    ]) {
      expect(existsSync(path.join(SRC, rel)), rel).toBe(false);
    }
  });

  it('the /site-settings route only serves the public GET', () => {
    const route = readFileSync(path.join(SRC, 'server/api/site-settings.ts'), 'utf8');
    expect(route).toContain('.get(');
    expect(route).not.toMatch(/\.(patch|put|post|delete)\(/);
    expect(route).not.toContain('canAny');
  });

  it('the legacy service and repository are read-only', () => {
    const service = readFileSync(path.join(SRC, 'server/services/site-settings-service.ts'), 'utf8');
    const repository = readFileSync(path.join(SRC, 'server/repositories/site-settings-repository.ts'), 'utf8');
    expect(service).not.toMatch(/updateSection|upsert|revalidateTag/);
    expect(repository).not.toMatch(/upsert|insert\(/);
  });

  it('every website page editor renders GlobalEditor for its page.* key', () => {
    const site = 'app/(main)/(protected)/(dashboard_layout)/dashboard/(site)';
    const pages: Record<string, string> = {
      [`${site}/about/page.tsx`]: 'page.about',
      [`${site}/insurance/page.tsx`]: 'page.insurance',
      [`${site}/process-page/page.tsx`]: 'page.process',
      [`${site}/services/(list)/page.tsx`]: 'page.services',
      [`${site}/projects/(list)/page.tsx`]: 'page.our-work',
      'features/home-page/components/home-page-tabs.tsx': 'page.home',
    };
    for (const [rel, key] of Object.entries(pages)) {
      const text = readFileSync(path.join(SRC, rel), 'utf8');
      expect(text, rel).toContain('GlobalEditor');
      expect(text, rel).toContain(`'${key}'`);
    }
  });
});
