import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { legalPages } from '@/server/db/schema';
import { getSitemapEntries } from '@/server/queries/get-page-seo';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

const content = { type: 'doc' as const, content: [] };

beforeEach(async () => {
  await db.execute(sql`truncate table settings, legal_pages cascade`);
});

describe('legal pages in the sitemap', () => {
  it('lists a published page with its last-updated date', async () => {
    const publishedAt = new Date('2026-10-01T09:00:00Z');
    await db
      .insert(legalPages)
      .values({ title: 'Privacy', slug: 'privacy-policy', content, status: 'published', publishedAt });
    const entry = (await getSitemapEntries()).find((e) => e.path === '/privacy-policy');
    expect(entry).toMatchObject({ changeFrequency: 'yearly', priority: 0.3, lastModified: publishedAt });
  });

  it('leaves out a page set noindex or pointing its canonical elsewhere', async () => {
    const published = { content, status: 'published' as const, publishedAt: new Date() };
    await db.insert(legalPages).values([
      { ...published, title: 'Hidden', slug: 'hidden', noindex: true },
      { ...published, title: 'Moved', slug: 'moved', canonical: '/privacy-policy' },
      { ...published, title: 'Own', slug: 'own', canonical: '/own' },
    ]);
    const paths = (await getSitemapEntries()).map((e) => e.path);
    expect(paths).toContain('/own');
    expect(paths).not.toContain('/hidden');
    expect(paths).not.toContain('/moved');
  });

  it('leaves drafts out', async () => {
    await db.insert(legalPages).values({ title: 'Terms', slug: 'terms', content });
    expect((await getSitemapEntries()).map((e) => e.path)).not.toContain('/terms');
  });
});
