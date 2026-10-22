import { eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { redirects } from '@/server/db/schema';

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
  await db.execute(sql`truncate table redirects cascade`);
});

const resolve = (path: string) => call(`/resolve?path=${encodeURIComponent(path)}`);

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

  it('passes an inactive row, a live page and an unknown path without a hit', async () => {
    await db.insert(redirects).values({ sourcePath: '/off', destination: '/services', isActive: false });
    await db.insert(redirects).values({ sourcePath: '/services-old', destination: '/services' });
    expect(await (await resolve('/off')).json()).toEqual({ kind: 'pass' });
    expect(await (await resolve('/services')).json()).toEqual({ kind: 'pass' });
    expect(await (await resolve('/zzz')).json()).toEqual({ kind: 'pass' });
    expect(pending).toHaveLength(0);
  });

  it('is 422 for a path that does not start with /', async () => {
    expect((await call('/resolve?path=nope')).status).toBe(422);
    expect((await call('/resolve')).status).toBe(422);
  });
});
