import { sql } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { hasPermission, ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { media, partnerLogos, settings } from '@/server/db/schema';
import { formatOpeningHoursSummary } from '@/lib/content/opening-hours';
import { computeSeoHealth } from '@/server/services/seo-health-service';
import { siteSettingsService } from '@/server/services/site-settings-service';

import { call, createTestUser, signInCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

let n = 0;
async function insertImage(over: Partial<typeof media.$inferInsert> = {}) {
  n += 1;
  const [row] = await db
    .insert(media)
    .values({
      driver: 'local',
      key: `vantage/media/2026/10/${String(n).padStart(16, '0')}-h.png`,
      url: `/uploads/h${n}.png`,
      filename: `h ${n}.png`,
      mimeType: 'image/png',
      sizeBytes: 1,
      width: 1200,
      height: 630,
      ...over,
    })
    .returning();
  return row!;
}
const put = (key: string, value: unknown) => db.insert(settings).values({ key, value });
const ref = (id: string) => ({ kind: 'media', id });
const forPage = (health: Awaited<ReturnType<typeof computeSeoHealth>>, id: string) =>
  health.issues.filter((i) => i.kind === 'page' && i.id === id);

beforeEach(async () => {
  await db.execute(sql`truncate table settings, partner_logos, media cascade`);
});

describe('computeSeoHealth', () => {
  it('scores the eight pages on an empty database', async () => {
    const h = await computeSeoHealth();
    expect(h.entities).toBe(8);
    expect(h.total).toBe(64);
    expect(h.alt).toEqual({ images: 0, described: 0, decorative: 0, missing: 0 });
    const title = forPage(h, 'services').find((i) => i.check === 'title-length');
    expect(title).toMatchObject({
      message: 'Title is 27 characters (aim for 30–60)',
      fixHref: '/dashboard/services?tab=seo',
      title: 'Services page',
      path: '/services',
    });
    expect(forPage(h, 'contact').every((i) => i.fixHref === '/dashboard/seo/pages/contact')).toBe(true);
    expect(forPage(h, 'contact').length).toBeGreaterThan(0);
    expect(h.score).toBe(Math.round((h.passed / h.total) * 100));
  });

  it('counts a page image without alt text, and clears it when decorative', async () => {
    const m = await insertImage({ alt: '', filename: 'no alt & caption.png' });
    await put('page.about', { hero: { image: ref(m.id) } });
    const h = await computeSeoHealth();
    expect(forPage(h, 'about').find((i) => i.check === 'alt-text')?.message).toBe('1 image missing alt text');
    const mediaIssues = h.issues.filter((i) => i.kind === 'media');
    expect(mediaIssues).toHaveLength(1);
    expect(mediaIssues[0]).toMatchObject({
      id: m.id,
      title: 'no alt & caption.png',
      message: 'Image has no alt text',
      fixHref: `/dashboard/media?missingAlt=true&q=${encodeURIComponent('no alt & caption.png')}`,
    });
    expect(h.alt).toMatchObject({ images: 1, missing: 1 });

    await db.execute(sql`update media set is_decorative = true`);
    const after = await computeSeoHealth();
    expect(forPage(after, 'about').find((i) => i.check === 'alt-text')).toBeUndefined();
    expect(after.issues.filter((i) => i.kind === 'media')).toHaveLength(0);
    expect(after.alt).toMatchObject({ images: 1, decorative: 1, missing: 0 });
  });

  it('ignores enquiry-scope and deleted media', async () => {
    const e = await insertImage({ alt: '', scope: 'enquiry' });
    const d = await insertImage({ alt: '', deletedAt: new Date() });
    await put('page.about', {
      hero: { image: ref(e.id) },
      team: { members: [{ name: 'a', role: 'b', image: ref(d.id) }] },
    });
    expect((await computeSeoHealth()).alt.images).toBe(0);
  });

  it('counts an enabled partner logo against home, not a disabled one', async () => {
    const m = await insertImage({ alt: '' });
    await db.insert(partnerLogos).values({ companyName: 'Off', logoMediaId: m.id, isEnabled: false });
    expect(forPage(await computeSeoHealth(), 'home').find((i) => i.check === 'alt-text')).toBeUndefined();
    await db.insert(partnerLogos).values({ companyName: 'On', logoMediaId: m.id, isEnabled: true });
    const h = await computeSeoHealth();
    expect(forPage(h, 'home').find((i) => i.check === 'alt-text')?.message).toBe('1 image missing alt text');
    expect(h.alt.missing).toBe(1);
  });

  it('fails the share-image check for a small page image', async () => {
    const m = await insertImage({ alt: 'x', width: 800, height: 600 });
    await put('seo.page.services', { ogImage: ref(m.id) });
    const og = forPage(await computeSeoHealth(), 'services').find((i) => i.check === 'og-image');
    expect(og?.message).toBe('Share image should be at least 1200×630 (1.91:1)');
  });

  it('grades the description that ships for home', async () => {
    const home = (h: Awaited<ReturnType<typeof computeSeoHealth>>) =>
      forPage(h, 'home').find((i) => i.check === 'description');
    expect(home(await computeSeoHealth())?.message).toBe('Description is 180 characters (aim for 70–160)');
    await put('seo', {
      defaultDescription: 'A good site description for the Dublin body shop, comfortably inside the range.',
    });
    expect(home(await computeSeoHealth())).toBeUndefined();
  });

  it('fails a share image whose size is unknown', async () => {
    const m = await insertImage({ alt: 'x', width: null, height: null });
    await put('seo.page.about', { ogImage: ref(m.id) });
    const og = forPage(await computeSeoHealth(), 'about').find((i) => i.check === 'og-image');
    expect(og?.message).toBe('Share image should be at least 1200×630 (1.91:1)');
  });

  it('grades the same home description the page ships when the saved default equals the derived one', async () => {
    const pub = await siteSettingsService.getPublic();
    const derived = `${pub.businessName} — ${formatOpeningHoursSummary(pub.openingHours)}`;
    await put('seo', { defaultDescription: derived });
    const msg = forPage(await computeSeoHealth(), 'home').find((i) => i.check === 'description')?.message;
    // The shipped page drops the derived default and uses the registry text (180 characters).
    expect(msg).toBe('Description is 180 characters (aim for 70–160)');
  });

  it('flags noindex', async () => {
    await put('seo', { robots: 'noindex' });
    expect((await computeSeoHealth()).issues.filter((i) => i.check === 'indexable')).toHaveLength(8);
  });
});

describe('production without SITE_ENV', () => {
  afterEach(() => vi.unstubAllEnvs());
  const prod = (siteEnv: string) => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SITE_ENV', siteEnv);
    vi.stubEnv('VERCEL_ENV', '');
  };

  it('reports that search engines are blocked, and no page is indexable', async () => {
    prod('');
    const h = await computeSeoHealth();
    expect(h.issues.find((i) => i.kind === 'site')).toMatchObject({
      id: 'site',
      check: 'indexable',
      message: 'Search engines are blocked: SITE_ENV is not set to production',
      fixHref: null,
    });
    expect(h.issues.filter((i) => i.kind === 'page' && i.check === 'indexable')).toHaveLength(8);
  });

  it('is silent once SITE_ENV is production, and outside a production build', async () => {
    prod('production');
    const h = await computeSeoHealth();
    expect(h.issues.some((i) => i.kind === 'site')).toBe(false);
    expect(h.issues.some((i) => i.check === 'indexable')).toBe(false);
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SITE_ENV', '');
    expect((await computeSeoHealth()).issues.some((i) => i.kind === 'site')).toBe(false);
  });
});

describe('GET /admin/seo/overview', () => {
  const cookies = {} as Record<RoleName, string>;
  beforeAll(async () => {
    for (const role of ROLE_NAMES) cookies[role] = await signInCookie((await createTestUser(role)).email);
  });

  it('rejects anonymous callers', async () => {
    expect((await call('/admin/seo/overview')).status).toBe(401);
  });

  it.each(ROLE_NAMES)('%s follows seo.read', async (role) => {
    const res = await call('/admin/seo/overview', cookies[role]);
    expect(res.status).toBe(hasPermission([role], { seo: ['read'] }) ? 200 : 403);
    if (res.status === 200) expect(((await res.json()) as { data: { entities: number } }).data.entities).toBe(8);
  });
});
