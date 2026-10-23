import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { RoleName } from '@/lib/auth/permissions';
import { api } from '@/server/api';
import { db } from '@/server/db';

import { sessionCookie } from '../support/session';

// Cache invalidation needs the Next.js runtime; the guards are what is under test.
vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

const ID = '00000000-0000-4000-8000-000000000001';

type Key =
  | 'content.read'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'page.update'
  | 'settings.update'
  | 'seo.update'
  | 'quote.read'
  | 'quote.update'
  | 'quote.delete'
  | 'contact.read'
  | 'contact.update'
  | 'contact.delete'
  | 'media.read'
  | 'media.delete'
  | 'user.list';

type Endpoint = { key: Key; method: string; path: string; body?: unknown };

const ENDPOINTS: Endpoint[] = [
  { key: 'content.read', method: 'GET', path: '/services/admin/list' },
  { key: 'content.read', method: 'GET', path: '/projects/admin/list' },
  { key: 'content.create', method: 'POST', path: '/services', body: {} },
  { key: 'content.update', method: 'PATCH', path: `/testimonials/${ID}`, body: {} },
  { key: 'content.delete', method: 'DELETE', path: `/partner-logos/${ID}` },
  { key: 'page.update', method: 'PUT', path: '/admin/globals/page.about', body: {} },
  { key: 'page.update', method: 'PUT', path: '/admin/globals/page.home', body: {} },
  { key: 'settings.update', method: 'PUT', path: '/admin/globals/site', body: {} },
  { key: 'seo.update', method: 'PUT', path: '/admin/globals/seo', body: {} },
  { key: 'quote.read', method: 'GET', path: '/quotes/admin/list' },
  { key: 'quote.read', method: 'GET', path: '/admin/assignees' },
  { key: 'quote.update', method: 'PATCH', path: `/quotes/${ID}`, body: {} },
  { key: 'quote.delete', method: 'DELETE', path: `/quotes/${ID}` },
  { key: 'contact.read', method: 'GET', path: '/contacts/admin/list' },
  { key: 'contact.update', method: 'PATCH', path: `/contacts/${ID}`, body: {} },
  { key: 'contact.delete', method: 'DELETE', path: `/contacts/${ID}` },
  { key: 'media.read', method: 'GET', path: '/admin/media' },
  { key: 'media.delete', method: 'DELETE', path: `/admin/media/${ID}` },
  { key: 'user.list', method: 'GET', path: '/admin/users' },
];

const ALL = [...new Set(ENDPOINTS.map((e) => e.key))];

// What the MK matrix grants each role on the endpoints above.
const GRANTED: Record<RoleName | 'user', Key[]> = {
  owner: ALL,
  admin: ALL,
  editor: [
    'content.read',
    'content.create',
    'content.update',
    'content.delete',
    'page.update',
    'seo.update',
    'media.read',
    'media.delete',
  ],
  author: ['content.read', 'content.create', 'content.update', 'media.read'],
  marketer: ['content.read', 'seo.update', 'media.read'],
  intake: ['quote.read', 'quote.update', 'contact.read', 'contact.update'],
  viewer: ['content.read'],
  user: [],
};

const ROLES = Object.keys(GRANTED) as (RoleName | 'user')[];
const cookies = {} as Record<RoleName | 'user', string>;

const call = (e: Endpoint, cookie?: string) =>
  api.request(`/api/v1${e.path}`, {
    method: e.method,
    headers: {
      origin: 'http://localhost:3000',
      ...(cookie ? { cookie } : {}),
      ...(e.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: e.body === undefined ? undefined : JSON.stringify(e.body),
  });

describe('admin API role matrix', () => {
  beforeAll(async () => {
    for (const role of ROLES) cookies[role] = await sessionCookie(role);
  });
  afterAll(async () => {
    await db.execute(sql`truncate table audit_logs, users cascade`);
  });

  for (const role of ROLES) {
    describe(`role ${role}`, () => {
      for (const e of ENDPOINTS) {
        const allowed = GRANTED[role].includes(e.key);
        it(`${e.method} ${e.path} -> ${allowed ? 'allowed' : '403'}`, async () => {
          const res = await call(e, cookies[role]);
          if (role === 'author' && e.path.startsWith('/testimonials')) {
            // Authors write only their own draft projects; the ownership check follows the guard.
            expect(res.status).toBe(403);
          } else if (allowed) {
            // Passed the guard: validation / not-found / 2xx, never auth errors.
            expect([401, 403]).not.toContain(res.status);
            expect(res.status).toBeLessThan(500);
          } else {
            expect(res.status).toBe(403);
            expect(((await res.json()) as { error: { code: string } }).error.code).toBe('FORBIDDEN');
          }
        });
      }
    });
  }

  it('returns real 2xx for permitted reads', async () => {
    expect((await call(ENDPOINTS[0]!, cookies.editor)).status).toBe(200);
    expect((await call({ key: 'quote.read', method: 'GET', path: '/quotes/admin/list' }, cookies.intake)).status).toBe(
      200,
    );
  });

  it('lists active quote-updating staff at /admin/assignees, sorted by name', async () => {
    const asIntake = await api.request('/api/v1/admin/assignees', { headers: { cookie: cookies.intake } });
    expect(asIntake.status).toBe(200);
    const { data } = (await asIntake.json()) as { data: { id: string; name: string; email: string }[] };
    const names = data.map((u) => u.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names).toEqual(expect.arrayContaining(['Test owner', 'Test admin', 'Test intake']));
    expect(names).not.toContain('Test marketer');
    expect(names).not.toContain('Test user');
    expect(Object.keys(data[0]!).sort()).toEqual(['email', 'id', 'name']);
    for (const role of ['owner', 'admin'] as const) {
      const res = await api.request('/api/v1/admin/assignees', { headers: { cookie: cookies[role] } });
      expect(res.status).toBe(200);
    }
  });

  it('returns 401 for every admin route without a session', async () => {
    for (const e of ENDPOINTS) {
      const res = await call(e);
      expect(res.status, `${e.method} ${e.path}`).toBe(401);
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe('UNAUTHORIZED');
    }
  });

  describe('GET /auth/me', () => {
    it('returns the MePayload for every admin role', async () => {
      for (const role of ROLES.filter((r) => r !== 'user')) {
        const res = await api.request('/api/v1/auth/me', { headers: { cookie: cookies[role] } });
        expect(res.status).toBe(200);
        const { data } = (await res.json()) as { data: { roles: string[]; permissions: object } };
        expect(data.roles).toEqual([role]);
        expect(data.permissions).toBeTypeOf('object');
      }
    });
    it('refuses a customer session with 403 and no session with 401', async () => {
      expect((await api.request('/api/v1/auth/me', { headers: { cookie: cookies.user } })).status).toBe(403);
      expect((await api.request('/api/v1/auth/me')).status).toBe(401);
    });
  });
});
