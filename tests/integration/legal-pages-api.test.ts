import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { auditLogs, legalPages } from '@/server/db/schema';

import { call, createTestUser, signInCookie } from '../support/session';

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
  data: { id: string; slug: string; status: string } & Record<string, unknown>;
  pagination?: { total: number };
  error: { code: string; causes?: Record<string, string[]> };
};
const json = async (res: Response) => (await res.json()) as Body;
const cookies = {} as Record<RoleName, string>;

const content = (href?: string) => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hi', ...(href ? { marks: [{ type: 'link', attrs: { href } }] } : {}) }],
    },
  ],
});
const create = (cookie: string, slug = 'privacy-policy', extra: object = {}) =>
  call('/legal-pages', cookie, {
    method: 'POST',
    body: { title: 'Privacy Policy', slug, content: content(), ...extra },
  });
const audits = (action: string) => db.select().from(auditLogs).where(eq(auditLogs.action, action));

beforeAll(async () => {
  for (const role of ROLE_NAMES) cookies[role] = await signInCookie((await createTestUser(role)).email);
});

beforeEach(async () => {
  await db.execute(sql`truncate table legal_pages, redirects, audit_logs cascade`);
});

describe('legal pages permissions', () => {
  it.each(['editor', 'admin', 'owner'] as const)('%s creates, lists, updates, deletes', async (role) => {
    const res = await create(cookies[role]);
    expect(res.status).toBe(201);
    const { id } = (await json(res)).data;
    expect(await audits('legal_page.create')).toHaveLength(1);

    const list = await call('/legal-pages/admin/list', cookies[role]);
    expect((await json(list)).pagination?.total).toBe(1);

    const patch = await call(`/legal-pages/${id}`, cookies[role], { method: 'PATCH', body: { status: 'published' } });
    expect((await json(patch)).data.status).toBe('published');

    expect((await call(`/legal-pages/${id}`, cookies[role], { method: 'DELETE' })).status).toBe(200);
    expect(await db.select().from(legalPages)).toEqual([]);
  });

  it.each(['viewer', 'marketer', 'author'] as const)('%s reads but cannot write', async (role) => {
    expect((await call('/legal-pages/admin/list', cookies[role])).status).toBe(200);
    expect((await create(cookies[role])).status).toBe(403);
  });

  it('refuses intake entirely', async () => {
    expect((await call('/legal-pages/admin/list', cookies.intake)).status).toBe(403);
  });

  it('rejects anonymous callers', async () => {
    expect((await call('/legal-pages/admin/list', undefined)).status).toBe(401);
  });
});

describe('legal pages validation', () => {
  it('refuses a slug the site already uses', async () => {
    const res = await create(cookies.owner, 'services');
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes?.slug).toHaveLength(1);
  });

  it('refuses a javascript: link in the body', async () => {
    const res = await create(cookies.owner, 'privacy-policy', { content: content('javascript:alert(1)') });
    expect(res.status).toBe(422);
  });

  it('404s an unknown page on update', async () => {
    const res = await call('/legal-pages/00000000-0000-4000-8000-000000000000', cookies.owner, {
      method: 'PATCH',
      body: { title: 'x' },
    });
    expect(res.status).toBe(404);
  });

  it('reorders pages', async () => {
    const a = (await json(await create(cookies.owner, 'privacy'))).data.id;
    const b = (await json(await create(cookies.owner, 'terms'))).data.id;
    const res = await call('/legal-pages/reorder', cookies.owner, { method: 'PATCH', body: { ids: [b, a] } });
    expect(res.status).toBe(200);
    const rows = await db.select().from(legalPages).orderBy(legalPages.displayOrder);
    expect(rows.map((r) => r.slug)).toEqual(['terms', 'privacy']);
  });
});
