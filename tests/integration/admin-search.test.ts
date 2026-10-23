import { sql } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';

import { db } from '@/server/db';

import { call, sessionCookie } from '../support/session';

type Hit = { id: string; kind: string; label: string; href: string };
const search = async (cookie: string | undefined, q = '') => {
  const res = await call(`/admin/search?q=${encodeURIComponent(q)}`, cookie);
  return { status: res.status, items: ((await res.json()).data?.items ?? []) as Hit[] };
};

afterAll(async () => {
  await db.execute(sql`truncate table users cascade`);
});

describe('GET /admin/search', () => {
  it('needs a session and the dashboard permission', async () => {
    expect((await search(undefined, 'a')).status).toBe(401);
    expect((await search(await sessionCookie('user'), 'a')).status).toBe(403);
  });

  it('gives intake nothing for "seo"', async () => {
    const { status, items } = await search(await sessionCookie('intake'), 'seo');
    expect(status).toBe(200);
    expect(items).toEqual([]);
  });

  it('gives a marketer the SEO and Marketing pages but not Custom code', async () => {
    const { items } = await search(await sessionCookie('marketer'), 'seo');
    expect(items.map((i) => i.label)).toEqual(['SEO › Overview', 'SEO › Defaults', 'SEO › Redirects']);
    const marketing = (await search(await sessionCookie('marketer'), 'marketing')).items.map((i) => i.label);
    expect(marketing).toEqual(['Marketing › Tracking', 'Marketing › Consent banner', 'Marketing › Event catalogue']);
    expect(marketing.join()).not.toContain('Custom code');
  });

  it('finds Quote requests for an owner searching "quote"', async () => {
    const { items } = await search(await sessionCookie('owner'), 'quote');
    expect(items).toContainEqual({
      id: 'nav:enquiries-quotes',
      kind: 'page',
      label: 'Enquiries › Quote requests',
      href: '/dashboard/quotes',
    });
  });

  it('lists every reachable page for an empty query and rejects a 101-character one', async () => {
    const cookie = await sessionCookie('owner');
    expect((await search(cookie)).items.length).toBeGreaterThan(10);
    expect((await search(cookie, 'a'.repeat(101))).status).toBe(422);
  });
});
