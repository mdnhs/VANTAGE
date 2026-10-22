import { sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { siteSettings } from '@/server/db/schema';
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

describe('page.our-work and page.insurance reach the adapter', () => {
  it('saves hero copy, lists and the disclaimer; blank list items are dropped', async () => {
    const ourWork = parseGlobal('page.our-work', {});
    ourWork.hero.eyebrow = 'Case studies';
    ourWork.hero.accent = 'Rebuilt.';
    expect((await put('page.our-work', cookies.editor, { version: 0, value: ourWork })).status).toBe(200);

    const insurance = parseGlobal('page.insurance', {});
    insurance.hero.line3 = 'Stress.';
    insurance.coordination.features = [
      { title: 'One call', description: 'We ring the insurer.' },
      { title: '', description: 'blank card' },
    ];
    insurance.steps.items = [
      { label: 'Drop off', description: 'Bring it in.' },
      { label: ' ', description: 'blank step' },
    ];
    insurance.disclaimer = 'Custom disclaimer text.';
    expect((await put('page.insurance', cookies.editor, { version: 0, value: insurance })).status).toBe(200);

    const settings = await siteSettingsService.getPublic();
    expect(settings.ourWorkHeroEyebrow).toBe('Case studies');
    expect(settings.ourWorkHeroHeadlineAccent).toBe('Rebuilt.');
    expect(settings.insuranceHeroLine3).toBe('Stress.');
    expect(settings.insuranceFeatures).toEqual([{ title: 'One call', description: 'We ring the insurer.' }]);
    expect(settings.insuranceSteps).toEqual([{ label: 'Drop off', description: 'Bring it in.' }]);
    expect(settings.insuranceDisclaimer).toBe('Custom disclaimer text.');
  });
});

describe('never-saved keys show the legacy copy until the migration has run', () => {
  const legacy = {
    id: 1,
    businessName: 'Legacy Co',
    phone: '',
    email: '',
    address: '',
    openingHours: '',
    heroEyebrow: 'Legacy eyebrow',
    heroHeadlineLine1: 'Legacy line',
  };

  it('GET shows the legacy values at version 0 and the first save creates version 1', async () => {
    await db.insert(siteSettings).values(legacy);

    const res = await call('/admin/globals/page.home', cookies.editor);
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: { version: number; value: { hero: Record<string, string> } } };
    expect(data.version).toBe(0);
    expect(data.value.hero.eyebrow).toBe('Legacy eyebrow');
    expect(data.value.hero.line1).toBe('Legacy line');
    // The public site agrees with the editor.
    expect((await siteSettingsService.getPublic()).heroEyebrow).toBe('Legacy eyebrow');

    const saved = await put('page.home', cookies.editor, { version: 0, value: data.value });
    expect(saved.status).toBe(200);
    expect(((await saved.json()) as { data: { version: number } }).data.version).toBe(1);

    const again = await call('/admin/globals/page.home', cookies.editor);
    const body = (await again.json()) as { data: { version: number; value: { hero: Record<string, string> } } };
    expect(body.data.version).toBe(1);
    expect(body.data.value.hero.eyebrow).toBe('Legacy eyebrow');
  });

  it('a stored key wins over the legacy row, and keys with no legacy row show the defaults', async () => {
    await db.insert(siteSettings).values(legacy);
    const value = parseGlobal('page.home', {});
    value.hero.eyebrow = 'Saved eyebrow';
    await put('page.home', cookies.editor, { version: 0, value });
    const res = await call('/admin/globals/page.home', cookies.editor);
    expect(((await res.json()) as { data: { value: { hero: Record<string, string> } } }).data.value.hero.eyebrow).toBe(
      'Saved eyebrow',
    );

    await db.execute(sql`truncate table settings, revisions, site_settings`);
    const empty = await call('/admin/globals/page.home', cookies.editor);
    expect(
      ((await empty.json()) as { data: { value: { hero: Record<string, string> } } }).data.value.hero.eyebrow,
    ).toBe(parseGlobal('page.home', {}).hero.eyebrow);
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
