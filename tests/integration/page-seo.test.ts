import { sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { media } from '@/server/db/schema';
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
  await db.execute(sql`truncate table settings, revisions, audit_logs, site_settings, media cascade`);
  vi.mocked(revalidateTag).mockClear();
});

type Img = { url: string; width?: number; height?: number };
const firstImage = (m: Awaited<ReturnType<typeof getPageMetadata>>) => (m.openGraph!.images as Img[])[0]!;

describe('public page SEO', () => {
  it('defaults to today with no rows saved', async () => {
    const m = await getPageMetadata('services');
    expect(m.title).toEqual({ absolute: 'Services | Vantage Autobody' });
    expect(m.alternates?.canonical).toBe('/services');
    expect(firstImage(m).url).toBe('/og');
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
});
