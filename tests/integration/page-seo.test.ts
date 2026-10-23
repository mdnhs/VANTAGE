import { eq, sql } from 'drizzle-orm';
import { cacheTag, revalidateTag } from 'next/cache';

import { parseGlobal } from '@/lib/content/globals';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { media, services, siteSettings } from '@/server/db/schema';
import { getPageMetadata, getSitemapEntries } from '@/server/queries/get-page-seo';

import { call, createTestUser, signInCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

let owner: string;
const put = (key: string, value: unknown, version = 0) =>
  call(`/admin/globals/${key}`, owner, { method: 'PUT', body: { version, value } });

beforeAll(async () => {
  owner = await signInCookie((await createTestUser('owner')).email);
});

beforeEach(async () => {
  await db.execute(
    sql`truncate table settings, revisions, audit_logs, site_settings, media, services, projects cascade`,
  );
  vi.mocked(revalidateTag).mockClear();
});

type Img = { url: string; width?: number; height?: number };
const firstImage = (m: Awaited<ReturnType<typeof getPageMetadata>>) => (m.openGraph!.images as Img[])[0]!;

describe('public page SEO', () => {
  it('defaults to today with no rows saved', async () => {
    const m = await getPageMetadata('services');
    expect(m.title).toEqual({ absolute: 'Services | Vantage Autobody' });
    expect(m.alternates?.canonical).toBe('/services');
    expect(firstImage(m).url).toBe('/og/services');
    expect(m.robots).toBeUndefined();
  });

  it('applies a saved page title and noindex, expiring only that tag', async () => {
    const res = await put('seo.page.services', { title: 'Body repairs Dublin', noindex: true });
    expect(res.status).toBe(200);
    const m = await getPageMetadata('services');
    expect(m.title).toEqual({ absolute: 'Body repairs Dublin | Vantage Autobody' });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([['settings:seo.page.services', { expire: 0 }]]);
  });

  it('uses the page share image when one is set', async () => {
    const [row] = await db
      .insert(media)
      .values({
        driver: 'local',
        key: 'vantage/media/2026/10/0000000000000001-og.png',
        url: '/uploads/og-test.png',
        filename: 'og.png',
        mimeType: 'image/png',
        sizeBytes: 1,
        width: 1200,
        height: 630,
      })
      .returning();
    expect((await put('seo.page.about', { ogImage: { kind: 'media', id: row!.id } })).status).toBe(200);
    const image = firstImage(await getPageMetadata('about'));
    expect(image.url).toBe('/uploads/og-test.png');
    expect(image.width).toBe(1200);
  });

  it('lists the sitemap pages and drops noindex ones', async () => {
    expect((await getSitemapEntries()).map((e) => e.path)).toHaveLength(8);
    await put('seo.page.services', { noindex: true });
    const paths = (await getSitemapEntries()).map((e) => e.path);
    expect(paths).not.toContain('/services');
    expect(paths).toHaveLength(7);
  });

  it('dates a page by the newest of its copy and SEO rows; an untouched page is undated', async () => {
    expect((await put('seo.page.about', { title: 'About us' })).status).toBe(200);
    expect((await put('page.about', parseGlobal('page.about', {}))).status).toBe(200);
    await db.execute(sql`update settings set updated_at = '2025-01-01T00:00:00Z' where key = 'seo.page.about'`);
    await db.execute(sql`update settings set updated_at = '2025-06-01T00:00:00Z' where key = 'page.about'`);
    const entries = await getSitemapEntries();
    expect(entries.find((e) => e.path === '/about')!.lastModified?.toISOString()).toBe('2025-06-01T00:00:00.000Z');
    expect(entries.find((e) => e.path === '/process')!.lastModified).toBeUndefined();
    const tags = vi.mocked(cacheTag).mock.calls.flat();
    expect(tags).toEqual(
      expect.arrayContaining(['services', 'projects', 'settings:page.about', 'settings:seo.page.about']),
    );
  });

  it('ignores disabled services for the date', async () => {
    await db.insert(services).values({ name: 'Off', slug: 'off', description: 'd', isEnabled: false });
    expect((await getSitemapEntries()).find((e) => e.path === '/services')!.lastModified).toBeUndefined();
  });

  it('moves /services when a service changes', async () => {
    const [row] = await db
      .insert(services)
      .values({ name: 'Paint', slug: 'paint', description: 'd', updatedAt: new Date('2025-01-01T00:00:00Z') })
      .returning();
    const first = (await getSitemapEntries()).find((e) => e.path === '/services')!.lastModified!;
    expect(first.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    await db
      .update(services)
      .set({ updatedAt: new Date('2026-02-02T00:00:00Z') })
      .where(eq(services.id, row!.id));
    const next = (await getSitemapEntries()).find((e) => e.path === '/services')!.lastModified!;
    expect(next.toISOString()).toBe('2026-02-02T00:00:00.000Z');
  });

  it('lists nothing when the whole site is noindex', async () => {
    expect((await put('seo', { robots: 'noindex' })).status).toBe(200);
    expect(await getSitemapEntries()).toEqual([]);
  });

  it('skips a page whose canonical points elsewhere', async () => {
    await put('seo.page.about', { canonical: 'https://elsewhere.ie/about' });
    await put('seo.page.process', { canonical: '/process' });
    const paths = (await getSitemapEntries()).map((e) => e.path);
    expect(paths).not.toContain('/about');
    expect(paths).toContain('/process');
  });

  it('keeps a page whose canonical is its own absolute address', async () => {
    const origin = 'https://vantage.example.ie';
    vi.stubEnv('NEXT_PUBLIC_APP_URL', origin);
    // (a trailing slash is rejected on save, so only the exact address is stored)
    expect((await put('seo.page.about', { canonical: `${origin}/about` })).status).toBe(200);
    expect((await put('seo.page.contact', { canonical: `${origin}/about` })).status).toBe(200);
    const paths = (await getSitemapEntries()).map((e) => e.path);
    expect(paths).toContain('/about');
    expect(paths).not.toContain('/contact');
    vi.unstubAllEnvs();
  });

  it('SEO defaults come only from the seo key, ignoring legacy site_settings meta', async () => {
    await db.insert(siteSettings).values({
      id: 1,
      businessName: 'Legacy Name',
      phone: '01 234 5678',
      email: 'info@example.com',
      address: 'Dublin',
      openingHours: 'Mon-Fri',
      metaTitle: 'Legacy Meta Title',
      metaDescription: 'Legacy Meta Description',
    });
    const m = await getPageMetadata('services');
    expect(m.title).toEqual({ absolute: 'Services | Vantage Autobody' });
  });
});
