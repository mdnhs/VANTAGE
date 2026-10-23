import { eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { auditLogs, redirects } from '@/server/db/schema';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

type Body = {
  success: boolean;
  data: { id: string; sourcePath: string; destination: string; isActive: boolean } & Record<string, unknown>;
  pagination?: { total: number };
  error: { code: string; message: string; causes?: Record<string, string[]> };
};
const json = async (res: Response) => (await res.json()) as Body;
const cookies = {} as Record<RoleName, string>;

beforeAll(async () => {
  for (const role of ROLE_NAMES) cookies[role] = await signInCookie((await createTestUser(role)).email);
});

beforeEach(async () => {
  await db.execute(sql`truncate table redirects, audit_logs cascade`);
  vi.mocked(revalidateTag).mockClear();
});

const create = (cookie: string, sourcePath: string, destination: string, extra: object = {}) =>
  call('/admin/redirects', cookie, { method: 'POST', body: { sourcePath, destination, ...extra } });
const dest = async (src: string) =>
  (await db.select().from(redirects).where(eq(redirects.sourcePath, src)))[0]?.destination;
const audits = (action: string) => db.select().from(auditLogs).where(eq(auditLogs.action, action));

describe('redirects permissions', () => {
  it.each(['marketer', 'editor', 'admin', 'owner'] as const)('%s creates, lists, audits', async (role) => {
    const res = await create(cookies[role], '/old', '/new');
    expect(res.status).toBe(201);
    expect((await json(res)).data).toMatchObject({ sourcePath: '/old', destination: '/new', isActive: true });
    expect(await audits('redirect.create')).toHaveLength(1);
    const list = await call('/admin/redirects', cookies[role]);
    expect(list.status).toBe(200);
    expect((await json(list)).pagination?.total).toBe(1);
  });

  it.each(['viewer', 'author', 'intake'] as const)('%s is refused list and write', async (role) => {
    expect((await call('/admin/redirects', cookies[role])).status).toBe(403);
    expect((await create(cookies[role], '/old', '/new')).status).toBe(403);
  });

  it('rejects anonymous callers', async () => {
    expect((await call('/admin/redirects')).status).toBe(401);
  });
});

describe('redirects rules', () => {
  it('409s a duplicate source with causes.sourcePath', async () => {
    await create(cookies.owner, '/a', '/b');
    const res = await create(cookies.owner, '/a', '/c');
    expect(res.status).toBe(409);
    expect((await json(res)).error.causes?.sourcePath).toEqual(['A redirect from that address already exists']);
  });

  it('rejects a live page, a reserved path and a self redirect', async () => {
    expect((await create(cookies.owner, '/services', '/b')).status).toBe(422);
    expect((await create(cookies.owner, '/login', '/b')).status).toBe(422);
    const res = await create(cookies.owner, '/a', '/a');
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes?.destination).toBeDefined();
  });

  it('rejects a destination inside the app, with causes.destination', async () => {
    for (const to of ['/api/v1/resolve', '/dashboard/users', '/login']) {
      const res = await create(cookies.owner, '/promo', to);
      expect(res.status, to).toBe(422);
      expect((await json(res)).error.causes?.destination, to).toBeDefined();
    }
    expect((await create(cookies.owner, '/promo', '/old-about.html')).status).toBe(201);
    expect((await create(cookies.owner, '/brochure', '/uploads/a.pdf')).status).toBe(201);
  });

  it('rejects a loop and flattens chains', async () => {
    await create(cookies.owner, '/a', '/b');
    const loop = await create(cookies.owner, '/b', '/a');
    expect(loop.status).toBe(422);
    expect((await json(loop)).error.causes?.destination).toEqual(['That would create a redirect loop']);
    expect((await create(cookies.owner, '/b', '/c')).status).toBe(201);
    expect(await dest('/a')).toBe('/c');
  });

  it('refuses to re-enable a row that would now loop', async () => {
    const a = await json(await create(cookies.owner, '/a', '/b'));
    await call(`/admin/redirects/${a.data.id}`, cookies.owner, { method: 'PATCH', body: { isActive: false } });
    expect((await create(cookies.owner, '/b', '/a')).status).toBe(201);
    const res = await call(`/admin/redirects/${a.data.id}`, cookies.owner, {
      method: 'PATCH',
      body: { isActive: true },
    });
    expect(res.status).toBe(422);
  });

  it('patches with a diff audit; an empty patch is 422 Nothing to change', async () => {
    const a = await json(await create(cookies.owner, '/a', '/b'));
    const res = await call(`/admin/redirects/${a.data.id}`, cookies.owner, {
      method: 'PATCH',
      body: { statusCode: 302, note: 'moved' },
    });
    expect(res.status).toBe(200);
    const [row] = await audits('redirect.update');
    expect(row!.diff).toMatchObject({ statusCode: { from: 301, to: 302 }, note: { from: '', to: 'moved' } });
    const empty = await call(`/admin/redirects/${a.data.id}`, cookies.owner, { method: 'PATCH', body: {} });
    expect(empty.status).toBe(422);
    expect(JSON.stringify((await json(empty)).error)).toContain('Nothing to change');
  });

  it('deletes with an audit and 404s the second delete and unknown ids', async () => {
    const a = await json(await create(cookies.owner, '/a', '/b'));
    const del = () => call(`/admin/redirects/${a.data.id}`, cookies.owner, { method: 'DELETE' });
    expect((await del()).status).toBe(200);
    expect(await audits('redirect.delete')).toHaveLength(1);
    expect((await del()).status).toBe(404);
    expect((await call('/admin/redirects/nope', cookies.owner, { method: 'DELETE' })).status).toBe(422);
  });

  it('searches with literal % and _, newest first', async () => {
    await create(cookies.owner, '/a_b', '/x');
    await create(cookies.owner, '/axb', '/x');
    const res = await json(await call('/admin/redirects?q=a_b', cookies.owner));
    expect((res.data as unknown as { sourcePath: string }[]).map((r) => r.sourcePath)).toEqual(['/a_b']);
  });
});

describe('redirects canonical paths and flattening', () => {
  it('refuses a loop written with a trailing slash', async () => {
    await create(cookies.owner, '/a', '/b');
    const res = await create(cookies.owner, '/b', '/a/');
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes?.destination).toEqual(['That would create a redirect loop']);
  });

  it('stores a dot-segment destination normalised', async () => {
    await create(cookies.owner, '/a', '/x/../b/?q=1');
    expect(await dest('/a')).toBe('/b?q=1');
  });

  it('flattens a legacy row pointing at /a/ when /a gets a rule', async () => {
    await db.insert(redirects).values({ sourcePath: '/x', destination: '/a/' });
    await create(cookies.owner, '/a', '/c');
    expect(await dest('/x')).toBe('/c');
  });

  it('flattens forward on create: a new /b to /c repoints /a', async () => {
    await create(cookies.owner, '/a', '/b');
    await create(cookies.owner, '/b', '/c');
    expect(await dest('/a')).toBe('/c');
    expect(await dest('/b')).toBe('/c');
  });

  it('creates through an existing chain end', async () => {
    await create(cookies.owner, '/b', '/c');
    await create(cookies.owner, '/a', '/b');
    expect(await dest('/a')).toBe('/c');
  });

  it('a PATCH destination change repoints rows that point at this row', async () => {
    const b = await json(await create(cookies.owner, '/b', '/c'));
    await db.insert(redirects).values({ sourcePath: '/a', destination: '/b' });
    const res = await call(`/admin/redirects/${b.data.id}`, cookies.owner, {
      method: 'PATCH',
      body: { destination: '/d' },
    });
    expect(res.status).toBe(200);
    expect(await dest('/b')).toBe('/d');
    expect(await dest('/a')).toBe('/d');
  });

  it('re-activation re-flattens', async () => {
    const a = await json(await create(cookies.owner, '/a', '/b'));
    await call(`/admin/redirects/${a.data.id}`, cookies.owner, { method: 'PATCH', body: { isActive: false } });
    await create(cookies.owner, '/b', '/c');
    const res = await call(`/admin/redirects/${a.data.id}`, cookies.owner, {
      method: 'PATCH',
      body: { isActive: true },
    });
    expect(res.status).toBe(200);
    expect(await dest('/a')).toBe('/c');
  });

  it('does not expire the tag when a write fails', async () => {
    await create(cookies.owner, '/a', '/b');
    vi.mocked(revalidateTag).mockClear();
    expect((await create(cookies.owner, '/a', '/c')).status).toBe(409);
    expect((await create(cookies.owner, '/b', '/a')).status).toBe(422);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe('redirects cache and View-as', () => {
  it('expires the redirects tag after each write', async () => {
    const a = await json(await create(cookies.owner, '/a', '/b'));
    await call(`/admin/redirects/${a.data.id}`, cookies.owner, { method: 'PATCH', body: { note: 'x' } });
    await call(`/admin/redirects/${a.data.id}`, cookies.owner, { method: 'DELETE' });
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([
      ['redirects', { expire: 0 }],
      ['redirects', { expire: 0 }],
      ['redirects', { expire: 0 }],
    ]);
  });

  it('refuses writes during View-as', async () => {
    const a = await json(await create(cookies.owner, '/a', '/b'));
    const target = await createTestUser('admin');
    const as = await viewAsCookie(cookies.owner, target.id);
    const results = [
      await create(as, '/c', '/d'),
      await call(`/admin/redirects/${a.data.id}`, as, { method: 'PATCH', body: { note: 'x' } }),
      await call(`/admin/redirects/${a.data.id}`, as, { method: 'DELETE' }),
    ];
    for (const res of results) {
      expect(res.status).toBe(403);
      expect((await json(res)).error.code).toBe('IMPERSONATION_READ_ONLY');
    }
  });
});
