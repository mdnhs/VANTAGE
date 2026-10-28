import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { legalPages, redirects } from '@/server/db/schema';
import type { Actor } from '@/server/lib/auth/actor';
import { legalPageRepository } from '@/server/repositories/legal-page-repository';
import { legalPageService } from '@/server/services/legal-page-service';
import type { TiptapDoc } from '@/validations/legal-page-schema';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

const actor = { userId: 'user-1', email: 'a@b.ie', name: 'A', roles: ['admin'] } as unknown as Actor;
const body = (text: string): TiptapDoc => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});
const page = (slug: string, extra: object = {}) =>
  legalPageService.create(actor, { title: 'Privacy Policy', slug, content: body('v1'), ...extra });
const redirectFrom = async (source: string) =>
  (await db.select().from(redirects).where(eq(redirects.sourcePath, source)))[0];
const errorOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as { status: number; causes?: Record<string, string[]> };
  }
  throw new Error('expected a rejection');
};

beforeEach(async () => {
  await db.execute(sql`truncate table legal_pages, redirects cascade`);
});

describe('publishing', () => {
  it('keeps a draft out of the public links', async () => {
    await page('privacy');
    expect(await legalPageService.listPublishedLinks()).toEqual([]);
    expect(await legalPageService.getPublishedBySlug('privacy')).toBeNull();
  });

  it('lists a published page and stamps publishedAt', async () => {
    const row = await page('privacy', { status: 'published' });
    expect(row?.publishedAt).toBeInstanceOf(Date);
    expect(await legalPageService.listPublishedLinks()).toEqual([{ title: 'Privacy Policy', slug: 'privacy' }]);
    expect((await legalPageService.getPublishedBySlug('privacy'))?.title).toBe('Privacy Policy');
  });

  it('stamps publishedAt when a draft is published', async () => {
    const row = await page('privacy');
    expect(row?.publishedAt).toBeNull();
    const saved = await legalPageService.update(actor, row!.id, { status: 'published' });
    expect(saved?.publishedAt).toBeInstanceOf(Date);
  });

  it('bumps publishedAt when a published page’s content changes', async () => {
    const row = await page('privacy', { status: 'published' });
    const saved = await legalPageService.update(actor, row!.id, { content: body('v2') });
    expect(saved!.publishedAt!.getTime()).toBeGreaterThan(row!.publishedAt!.getTime());
  });

  it('leaves publishedAt alone on a reorder', async () => {
    const a = await page('privacy', { status: 'published' });
    const b = await page('terms', { status: 'published' });
    await legalPageService.reorder({ ids: [b!.id, a!.id] });
    expect((await legalPageService.byId(a!.id))?.publishedAt).toEqual(a!.publishedAt);
    expect((await legalPageService.listPublishedLinks()).map((l) => l.slug)).toEqual(['terms', 'privacy']);
  });

  it('leaves publishedAt alone on a slug-only rename', async () => {
    const row = await page('privacy', { status: 'published' });
    const saved = await legalPageService.update(actor, row!.id, { slug: 'privacy-policy' });
    expect(saved?.publishedAt).toEqual(row!.publishedAt);
  });
});

describe('renaming', () => {
  it('redirects the old address of a published page', async () => {
    const row = await page('privacy', { status: 'published' });
    await legalPageService.update(actor, row!.id, { slug: 'privacy-policy' });
    expect(await redirectFrom('/privacy')).toMatchObject({ destination: '/privacy-policy', statusCode: 301 });
  });

  it('adds no redirect when a draft is renamed', async () => {
    const row = await page('privacy');
    await legalPageService.update(actor, row!.id, { slug: 'privacy-policy' });
    expect(await redirectFrom('/privacy')).toBeUndefined();
  });

  it('renaming back replaces the stale redirect instead of looping', async () => {
    const row = await page('privacy', { status: 'published' });
    await legalPageService.update(actor, row!.id, { slug: 'privacy-policy' });
    await legalPageService.update(actor, row!.id, { slug: 'privacy' });
    expect(await redirectFrom('/privacy')).toBeUndefined();
    expect(await redirectFrom('/privacy-policy')).toMatchObject({ destination: '/privacy' });
  });
});

describe('slug rules', () => {
  it.each(['about', 'services', 'dashboard', 'login', 'api'])('refuses the app’s own address /%s', async (slug) => {
    const error = await errorOf(page(slug));
    expect(error.status).toBe(422);
    expect(error.causes?.slug).toHaveLength(1);
  });

  it('refuses a slug another page already uses', async () => {
    await page('privacy');
    expect((await errorOf(page('privacy'))).status).toBe(422);
  });

  it('refuses a slug that an existing redirect starts from', async () => {
    await db.insert(redirects).values({ sourcePath: '/privacy', destination: '/contact' });
    const error = await errorOf(page('privacy'));
    expect(error.status).toBe(409);
    expect(error.causes?.slug?.[0]).toContain('/privacy');
  });
});

describe('failures', () => {
  it('propagates a read failure instead of answering with no pages', async () => {
    vi.spyOn(legalPageRepository, 'listPublished').mockRejectedValueOnce(new Error('db down'));
    await expect(legalPageService.listPublishedLinks()).rejects.toThrow('db down');
  });
});

describe('deleting', () => {
  it('removes the row', async () => {
    const row = await page('privacy', { status: 'published' });
    await legalPageService.remove(row!.id);
    expect(await db.select().from(legalPages)).toEqual([]);
  });
});
