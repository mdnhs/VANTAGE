import { eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { legalPages, redirects } from '@/server/db/schema';

import { serverEnv } from '@/lib/env';
import { HIT_HEADER, hitToken } from '@/lib/seo/hit-token';

import { call } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
}));
// Run the after() callback immediately, outside a request scope.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => unknown) => {
    pending.push(Promise.resolve(fn()));
  },
}));
const pending: Promise<unknown>[] = [];

beforeEach(async () => {
  pending.length = 0;
  vi.mocked(revalidateTag).mockClear();
  await db.execute(sql`truncate table redirects, legal_pages cascade`);
});

const signed = (path: string) => ({ [HIT_HEADER]: hitToken(serverEnv().AUTH_SECRET, path) });
const resolve = (path: string, headers: Record<string, string> = signed(path)) =>
  call(`/resolve?path=${encodeURIComponent(path)}`, undefined, { headers });
const hits = async (path: string) =>
  (await db.select().from(redirects).where(eq(redirects.sourcePath, path)))[0]!.hitCount;

describe('GET /resolve', () => {
  it('redirects an active row, no-store, and records the hit', async () => {
    await db.insert(redirects).values({ sourcePath: '/old', destination: '/services' });
    const res = await resolve('/old');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ kind: 'redirect', destination: '/services', statusCode: 301 });
    await Promise.all(pending);
    const [row] = await db.select().from(redirects).where(eq(redirects.sourcePath, '/old'));
    expect(row!.hitCount).toBe(1);
    expect(row!.lastHitAt).not.toBeNull();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('answers but does not count an unsigned or wrongly signed call', async () => {
    await db.insert(redirects).values({ sourcePath: '/old', destination: '/services' });
    expect(await (await resolve('/old', {})).json()).toMatchObject({ kind: 'redirect' });
    expect(
      await (await resolve('/old', { [HIT_HEADER]: hitToken(serverEnv().AUTH_SECRET, '/other') })).json(),
    ).toMatchObject({
      kind: 'redirect',
    });
    await Promise.all(pending);
    expect(await hits('/old')).toBe(0);
  });

  it('still answers the redirect, uncounted, when AUTH_SECRET is missing', async () => {
    await db.insert(redirects).values({ sourcePath: '/old', destination: '/services' });
    const headers = signed('/old');
    vi.stubEnv('AUTH_SECRET', '');
    const res = await resolve('/old', headers);
    vi.unstubAllEnvs();
    expect(await res.json()).toMatchObject({ kind: 'redirect' });
    await Promise.all(pending);
    expect(await hits('/old')).toBe(0);
  });

  it('does not touch updated_at on a hit', async () => {
    const old = new Date('2024-01-01T00:00:00Z');
    await db.insert(redirects).values({ sourcePath: '/old', destination: '/services', updatedAt: old });
    await resolve('/old');
    await Promise.all(pending);
    const [row] = await db.select().from(redirects).where(eq(redirects.sourcePath, '/old'));
    expect(row!.hitCount).toBe(1);
    expect(row!.updatedAt.getTime()).toBe(old.getTime());
  });

  it('resolves a legacy page source', async () => {
    await db.insert(redirects).values({ sourcePath: '/about.html', destination: '/services' });
    expect(await (await resolve('/about.html')).json()).toMatchObject({ kind: 'redirect', destination: '/services' });
  });

  it('passes a live page and a deeper unknown path without a hit', async () => {
    await db.insert(redirects).values({ sourcePath: '/services-old', destination: '/services' });
    expect(await (await resolve('/services')).json()).toEqual({ kind: 'pass' });
    expect(await (await resolve('/zzz/deeper')).json()).toEqual({ kind: 'pass' });
    expect(pending).toHaveLength(0);
  });

  it('calls an unknown or switched-off single-segment address missing, so it gets a real 404', async () => {
    await db.insert(redirects).values({ sourcePath: '/off', destination: '/services', isActive: false });
    expect(await (await resolve('/off')).json()).toEqual({ kind: 'missing' });
    expect(await (await resolve('/zzz')).json()).toEqual({ kind: 'missing' });
    expect(pending).toHaveLength(0);
  });

  it('passes a published legal page and calls a draft one missing', async () => {
    const content = { type: 'doc' as const, content: [] };
    await db.insert(legalPages).values([
      { title: 'Privacy', slug: 'privacy-policy', content, status: 'published', publishedAt: new Date() },
      { title: 'Terms', slug: 'terms', content },
    ]);
    expect(await (await resolve('/privacy-policy')).json()).toEqual({ kind: 'pass' });
    expect(await (await resolve('/terms')).json()).toEqual({ kind: 'missing' });
  });

  it('is 422 for a path that does not start with /', async () => {
    expect((await call('/resolve?path=nope')).status).toBe(422);
    expect((await call('/resolve')).status).toBe(422);
  });
});
