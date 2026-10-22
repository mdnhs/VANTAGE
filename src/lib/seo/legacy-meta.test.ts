import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

vi.mock('server-only', () => ({}));
vi.mock('@/server/lib/media/resolve', () => ({ toPublicImage: () => null, loadPublicImages: async () => ({}) }));
vi.mock('@/server/queries/get-setting', () => ({ getSetting: async () => null }));
vi.mock('@/server/services/site-settings-service', () => ({ siteSettingsService: {} }));

import { withLegacyMeta } from '@/server/queries/get-page-seo';

import { rootMetadata } from './metadata';

describe('legacy meta fallback', () => {
  it('a legacy meta title, description and Twitter handle still reach the root metadata', () => {
    const seo = withLegacyMeta(parseGlobal('seo', undefined), {
      metaTitle: 'Legacy title',
      metaDescription: 'Legacy description',
      twitterHandle: '@legacy',
    });
    const m = rootMetadata({
      appUrl: 'https://x.ie',
      seo,
      siteName: 'Vantage',
      hoursSummary: 'h',
      defaultOgImage: null,
    });
    expect(m.title).toMatchObject({ default: 'Legacy title' });
    expect(m.description).toBe('Legacy description');
    expect(m.twitter).toMatchObject({ site: '@legacy' });
  });
});

describe('build-time SITE_ENV', () => {
  it('the Dockerfile and compose pass SITE_ENV to the builder', () => {
    const root = process.cwd();
    const docker = readFileSync(join(root, 'Dockerfile'), 'utf8');
    expect(docker).toMatch(/ARG SITE_ENV\nENV SITE_ENV=\$SITE_ENV/);
    expect(readFileSync(join(root, 'docker-compose.yml'), 'utf8')).toContain('SITE_ENV: ${SITE_ENV:-}');
  });
});
