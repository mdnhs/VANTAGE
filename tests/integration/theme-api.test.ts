import { eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { DEFAULT_THEME } from '@/lib/theme/schema';
import { db } from '@/server/db';
import { auditLogs, revisions, settings } from '@/server/db/schema';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

const draftState = vi.hoisted(() => ({ enable: vi.fn(), disable: vi.fn() }));
vi.mock('next/headers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  draftMode: async () => draftState,
}));
vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

type Doc = {
  value: { site: { brand: string | null; fonts: unknown }; admin: Record<string, unknown> };
  draft: { site: { brand: string | null; fonts: unknown }; admin: Record<string, unknown> };
  hasDraft: boolean;
  version: number;
  issues: unknown[];
};
type Body = {
  success: boolean;
  data: Doc & { items?: { id: string; note: string | null; createdByName: string | null }[] };
  error: { code: string; message: string; current?: { updatedBy?: string } };
};
const json = async (res: Response) => (await res.json()) as Body;
const get = (cookie: string) => call('/admin/theme', cookie);
const put = (cookie: string, version: number, draft: unknown) =>
  call('/admin/theme/draft', cookie, { method: 'PUT', body: { version, draft } });
const post = (cookie: string, path: string, body: unknown) =>
  call(`/admin/theme/${path}`, cookie, { method: 'POST', body });

const cookies = {} as Record<RoleName, string>;
let adminName: string;

beforeAll(async () => {
  for (const role of ROLE_NAMES) {
    const user = await createTestUser(role);
    cookies[role] = await signInCookie(user.email);
    if (role === 'admin') adminName = `Test ${role}`;
  }
});

afterEach(() => vi.restoreAllMocks());

beforeEach(async () => {
  await db.execute(sql`truncate table settings, revisions, audit_logs`);
  vi.mocked(revalidateTag).mockClear();
  draftState.enable.mockClear();
  draftState.disable.mockClear();
});

const red = { site: { brand: '#c42424' } };

describe('GET /admin/theme', () => {
  it('returns the defaults at version 0 on an empty database', async () => {
    const { data } = await json(await get(cookies.owner));
    expect(data).toMatchObject({ version: 0, hasDraft: false, issues: [] });
    expect(data.value).toEqual(DEFAULT_THEME);
  });

  it.each(['editor', 'marketer', 'viewer', 'intake', 'author'] as const)('%s is forbidden', async (role) => {
    if (!(role in cookies)) return;
    expect((await get(cookies[role])).status).toBe(403);
  });

  it('serves the defaults for a drifted stored value', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await db.insert(settings).values({ key: 'theme', value: { site: { brand: 42 } }, version: 3 });
    const { data } = await json(await get(cookies.owner));
    expect(data.version).toBe(3);
    expect(data.value).toEqual(DEFAULT_THEME);
  });
});

describe('PUT /admin/theme/draft', () => {
  it('saves a draft without audit, revision or cache expiry', async () => {
    const res = await put(cookies.admin, 0, red);
    expect(res.status).toBe(200);
    const { data } = await json(res);
    expect(data).toMatchObject({ version: 1, hasDraft: true });
    expect(data.draft.site.brand).toMatch(/^oklch\(/);
    expect(data.value).toEqual(DEFAULT_THEME);
    expect(await db.select().from(auditLogs)).toHaveLength(0);
    expect(await db.select().from(revisions)).toHaveLength(0);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('answers a stale version with 409 and who saved it', async () => {
    await put(cookies.admin, 0, red);
    const res = await put(cookies.owner, 0, red);
    expect(res.status).toBe(409);
    expect((await json(res)).error.current).toMatchObject({ updatedBy: adminName });
  });

  it('rejects an invalid colour with 422', async () => {
    expect((await put(cookies.admin, 0, { site: { brand: 'red' } })).status).toBe(422);
  });
});

describe('POST /admin/theme/publish', () => {
  it('blocks a hard-to-read brand with the contrast message', async () => {
    await put(cookies.admin, 0, { site: { brand: '#ffd400' } });
    const res = await post(cookies.admin, 'publish', { version: 1 });
    expect(res.status).toBe(422);
    const { error } = await json(res);
    expect(error.message.startsWith('Some colours are too hard to read.')).toBe(true);
    expect(await db.select().from(revisions)).toHaveLength(0);
  });

  it('publishes the draft, writes one revision and one audit row, expires the tag', async () => {
    await put(cookies.admin, 0, red);
    const res = await post(cookies.admin, 'publish', { version: 1 });
    expect(res.status).toBe(200);
    const { data } = await json(res);
    expect(data.value.site.brand).toMatch(/^oklch\(/);
    expect(data.hasDraft).toBe(false);
    const revs = await db.select().from(revisions).where(eq(revisions.entityId, 'theme'));
    expect(revs.map((r) => r.note)).toEqual(['Published theme']);
    const audits = await db.select().from(auditLogs).where(eq(auditLogs.action, 'appearance.publish'));
    expect(audits).toHaveLength(1);
    expect(audits[0]!.diff).toHaveProperty('site');
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([['settings:theme', { expire: 0 }]]);
    const [row] = await db.select().from(settings).where(eq(settings.key, 'theme'));
    expect(row!.draft).toBeNull();
  });

  it('publishes with only the viewer-forbidden roles refused', async () => {
    expect((await post(cookies.viewer, 'publish', { version: 0 })).status).toBe(403);
  });
});

describe('POST /admin/theme/reset and /discard', () => {
  it('resets the admin half to a preset, keeping the site half, radius and mode', async () => {
    await put(cookies.admin, 0, { site: { brand: '#c42424' }, admin: { radius: 0.5, mode: 'dark' } });
    const { data } = await json(await post(cookies.admin, 'reset', { version: 1, preset: 'ocean', scope: 'admin' }));
    expect(data.draft.admin).toMatchObject({ preset: 'ocean', radius: 0.5, mode: 'dark', primary: null });
    expect(data.draft.site.brand).toMatch(/^oklch\(/);
  });

  it('resets the site half to the VANTAGE default', async () => {
    await put(cookies.admin, 0, red);
    const { data } = await json(await post(cookies.admin, 'reset', { version: 1, preset: 'ocean', scope: 'site' }));
    expect(data.draft.site).toEqual(DEFAULT_THEME.site);
    expect(data.draft.admin.preset).toBe('vantage-red');
  });

  it('discards the draft and audits it', async () => {
    await put(cookies.admin, 0, red);
    const { data } = await json(await post(cookies.admin, 'discard', { version: 1 }));
    expect(data.hasDraft).toBe(false);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'appearance.discard'))).toHaveLength(1);
  });
});

describe('revisions and restore', () => {
  it('lists revisions with the author name', async () => {
    await put(cookies.admin, 0, red);
    await post(cookies.admin, 'publish', { version: 1 });
    const { data } = await json(await call('/admin/theme/revisions', cookies.owner));
    expect(data.items).toHaveLength(1);
    expect(data.items![0]).toMatchObject({ note: 'Published theme', createdByName: adminName });
  });

  it('loads a published revision into the draft, leaving the value alone', async () => {
    await put(cookies.admin, 0, red);
    await post(cookies.admin, 'publish', { version: 1 });
    const publishedBrand = (await json(await get(cookies.owner))).data.value.site.brand;
    await put(cookies.admin, 2, { site: { brand: '#7f1d1d' } });
    const [rev] = await db.select().from(revisions);
    const res = await post(cookies.admin, `revisions/${rev!.id}/restore`, { version: 3 });
    expect(res.status).toBe(200);
    const { data } = await json(res);
    expect(data.hasDraft).toBe(true);
    expect(data.draft.site.brand).toBe(publishedBrand);
    expect(data.value.site.brand).toBe(publishedBrand);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'appearance.restore'))).toHaveLength(1);
  });

  it('answers an unknown revision and a non-theme revision with 404', async () => {
    const random = await post(cookies.admin, `revisions/${crypto.randomUUID()}/restore`, { version: 0 });
    expect(random.status).toBe(404);
    const [other] = await db
      .insert(revisions)
      .values({ entityType: 'page', entityId: 'page.home', version: 1, snapshot: {} })
      .returning();
    const res = await post(cookies.admin, `revisions/${other!.id}/restore`, { version: 0 });
    expect(res.status).toBe(404);
    expect((await json(res)).error.message).toBe("That version doesn't exist");
  });
});

describe('View-as', () => {
  it('refuses mutations with the read-only message but still reads', async () => {
    const target = await createTestUser('admin');
    const viewing = await viewAsCookie(cookies.owner, target.id);
    const res = await put(viewing, 0, red);
    expect(res.status).toBe(403);
    expect((await json(res)).error.message).toBe('View-as is read-only: the theme cannot be changed');
    expect((await get(viewing)).status).toBe(200);
    expect(await db.select().from(settings)).toHaveLength(0);
  });
});

describe('/preview', () => {
  it('enables draft mode for appearance readers and redirects', async () => {
    const res = await call('/preview?path=/services', cookies.owner);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/services');
    // vitest has no Next request store, so the bypass cookie itself is Next's job.
    expect(draftState.enable).toHaveBeenCalledOnce();
  });

  it('refuses roles without appearance.read', async () => {
    expect((await call('/preview?path=/', cookies.editor)).status).toBe(403);
    expect(draftState.enable).not.toHaveBeenCalled();
  });

  it('refuses an off-site path', async () => {
    expect((await call('/preview?path=//evil.com', cookies.owner)).status).toBe(422);
  });

  it('exits without auth, falling back to / for an odd path', async () => {
    const res = await call('/preview/exit?path=//x');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/');
    expect(draftState.disable).toHaveBeenCalledOnce();
  });
});
