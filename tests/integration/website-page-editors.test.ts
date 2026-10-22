import { sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { siteSettingsService } from '@/server/services/site-settings-service';

import { call, createTestUser, signInCookie } from '../support/session';

// Cache directives and invalidation need the Next.js runtime; the save path and the
// public adapter are what is under test.
vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

const cookies = {} as Record<'owner' | 'editor' | 'author' | 'viewer' | 'marketer', string>;
const ROLES = ['owner', 'editor', 'author', 'viewer', 'marketer'] as const;

beforeAll(async () => {
  for (const role of ROLES) cookies[role] = await signInCookie((await createTestUser(role)).email);
});

afterAll(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});

beforeEach(async () => {
  await db.execute(sql`truncate table settings, revisions, audit_logs, site_settings`);
  vi.mocked(revalidateTag).mockClear();
});

const put = (key: string, cookie: string, body: unknown) =>
  call(`/admin/globals/${key}`, cookie, { method: 'PUT', body });

describe('page.update saves website page copy that the public adapter serves', () => {
  it.each(['owner', 'editor'] as const)('%s saves page.home and getPublic reflects it', async (role) => {
    const value = parseGlobal('page.home', {});
    value.hero.eyebrow = 'Dublin collision experts';
    value.hero.line1 = 'We Fix';
    value.trustBadges[0] = { title: 'Five stars', subtitle: '200 reviews' };
    value.catalog.accent = 'Like New.';

    const res = await put('page.home', cookies[role], { version: 0, value });
    expect(res.status).toBe(200);
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith('settings:page.home', { expire: 0 });

    const settings = await siteSettingsService.getPublic();
    expect(settings.heroEyebrow).toBe('Dublin collision experts');
    expect(settings.heroHeadlineLine1).toBe('We Fix');
    expect(settings.trustBadge1Title).toBe('Five stars');
    expect(settings.trustBadge1Subtitle).toBe('200 reviews');
    expect(settings.catalogHeadlineAccent).toBe('Like New.');
  });

  it('page.about, page.process and page.services reach the adapter too', async () => {
    const about = parseGlobal('page.about', {});
    about.team.members[0] = { name: 'Aoife Byrne', role: 'Estimator', image: null };
    expect((await put('page.about', cookies.editor, { version: 0, value: about })).status).toBe(200);

    const process = parseGlobal('page.process', {});
    process.title = 'Our {count} Steps';
    expect((await put('page.process', cookies.editor, { version: 0, value: process })).status).toBe(200);

    const services = parseGlobal('page.services', {});
    services.hero.eyebrow = 'What we do';
    expect((await put('page.services', cookies.editor, { version: 0, value: services })).status).toBe(200);

    const settings = await siteSettingsService.getPublic();
    expect(settings.aboutTeamMembers?.[0]).toMatchObject({ name: 'Aoife Byrne', role: 'Estimator' });
    expect(settings.processPageTitle).toBe('Our {count} Steps');
    expect(settings.servicesHeroEyebrow).toBe('What we do');
  });

  it('a second save needs the new version (409 on the stale one)', async () => {
    const value = parseGlobal('page.process', {});
    expect((await put('page.process', cookies.owner, { version: 0, value })).status).toBe(200);
    expect((await put('page.process', cookies.owner, { version: 0, value })).status).toBe(409);
  });
});

describe('roles without page.update', () => {
  it.each(['author', 'viewer', 'marketer'] as const)('%s gets 403 and nothing is stored', async (role) => {
    const value = parseGlobal('page.home', {});
    value.hero.eyebrow = 'Should not be saved';
    const res = await put('page.home', cookies[role], { version: 0, value });
    expect(res.status).toBe(403);

    const stored = await db.execute(sql`select count(*)::int as n from settings where key = 'page.home'`);
    expect((stored.rows[0] as { n: number }).n).toBe(0);
    expect(vi.mocked(revalidateTag)).not.toHaveBeenCalled();
    expect((await siteSettingsService.getPublic()).heroEyebrow).not.toBe('Should not be saved');
  });

  it('the removed PATCH endpoints are gone', async () => {
    for (const path of ['/site-settings/homepage-hero', '/site-settings/about-page', '/site-settings/seo']) {
      const res = await call(path, cookies.owner, { method: 'PATCH', body: {} });
      expect(res.status, path).toBe(404);
    }
    expect((await call('/site-settings/admin', cookies.owner)).status).toBe(404);
    expect((await call('/site-settings')).status).toBe(200);
  });
});
