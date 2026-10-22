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
  | 'settings.admin-read'
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
  { key: 'page.update', method: 'PATCH', path: '/site-settings/about-page', body: {} },
  { key: 'page.update', method: 'PATCH', path: '/site-settings/homepage-hero', body: {} },
  { key: 'settings.update', method: 'PATCH', path: '/site-settings/business-info', body: {} },
  { key: 'settings.update', method: 'PATCH', path: '/site-settings/seo', body: {} },
  { key: 'settings.admin-read', method: 'GET', path: '/site-settings/admin' },
  { key: 'quote.read', method: 'GET', path: '/quotes/admin/list' },
  { key: 'quote.update', method: 'PATCH', path: `/quotes/${ID}`, body: {} },
  { key: 'quote.delete', method: 'DELETE', path: `/quotes/${ID}` },
  { key: 'contact.read', method: 'GET', path: '/contacts/admin/list' },
  { key: 'contact.update', method: 'PATCH', path: `/contacts/${ID}`, body: {} },
  { key: 'contact.delete', method: 'DELETE', path: `/contacts/${ID}` },
  { key: 'media.read', method: 'GET', path: '/admin/media' },
  { key: 'media.delete', method: 'DELETE', path: `/admin/media/${ID}` },
  { key: 'user.list', method: 'GET', path: '/users' },
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
    'settings.admin-read',
    'media.read',
    'media.delete',
  ],
  author: ['content.read', 'content.create', 'content.update', 'settings.admin-read', 'media.read'],
  marketer: ['content.read', 'settings.admin-read', 'media.read'],
  intake: ['quote.read', 'quote.update', 'contact.read', 'contact.update'],
  viewer: ['content.read', 'settings.admin-read'],
  user: [],
};

const ROLES = Object.keys(GRANTED) as (RoleName | 'user')[];
const cookies = {} as Record<RoleName | 'user', string>;

const call = (e: Endpoint, cookie?: string) =>
  api.request(`/api/v1${e.path}`, {
    method: e.method,
    headers: {
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
          if (allowed) {
            // Passed the guard: validation / not-found / 2xx, never auth errors.
            expect([401, 403]).not.toContain(res.status);
            expect(res.status).toBeLessThan(500);
          } else {
            expect(res.status).toBe(403);
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

  it('returns 401 for every admin route without a session', async () => {
    for (const e of ENDPOINTS) expect((await call(e)).status, `${e.method} ${e.path}`).toBe(401);
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
