import { eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { hasPermission, ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { EDITABLE_GLOBAL_KEYS, GLOBAL_ACCESS } from '@/lib/content/global-access';
import { parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { auditLogs, media, revisions, settings } from '@/server/db/schema';

import { call, createTestUser, sessionCookie, signInCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

type Body = {
  success: boolean;
  data: {
    key: string;
    value: Record<string, unknown>;
    version: number;
    updatedBy?: string | null;
    items?: { id: string; version: number; note: string | null; createdByName: string | null }[];
  };
  error: { code: string; message: string; causes?: Record<string, string[]>; current?: Record<string, unknown> };
};
const json = async (res: Response) => (await res.json()) as Body;
const put = (cookie: string, key: string, body: unknown) =>
  call(`/admin/globals/${key}`, cookie, { method: 'PUT', body });

const cookies = {} as Record<RoleName, string>;
let ownerId: string;
let ownerName: string;

beforeAll(async () => {
  for (const role of ROLE_NAMES) {
    const user = await createTestUser(role);
    cookies[role] = await signInCookie(user.email);
    if (role === 'owner') {
      ownerId = user.id;
      ownerName = `Test ${role}`;
    }
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(async () => {
  await db.execute(sql`truncate table settings, revisions, audit_logs, site_settings, media cascade`);
  vi.mocked(revalidateTag).mockClear();
});

describe('globals permission matrix', () => {
  it('rejects anonymous callers', async () => {
    expect((await call('/admin/globals/contact')).status).toBe(401);
    expect((await put('', 'contact', {})).status).toBe(401);
  });

  describe.each(ROLE_NAMES)('%s', (role) => {
    it.each(EDITABLE_GLOBAL_KEYS)('%s: GET needs read, PUT needs update', async (key) => {
      const canRead = hasPermission([role], GLOBAL_ACCESS[key].read);
      const canUpdate = hasPermission([role], GLOBAL_ACCESS[key].update);
      expect((await call(`/admin/globals/${key}`, cookies[role])).status).toBe(canRead ? 200 : 403);
      // An invalid body proves the guard passed: allowed roles reach validation (422).
      expect((await put(cookies[role], key, {})).status).toBe(canUpdate ? 422 : 403);
      expect((await call(`/admin/globals/${key}/revisions`, cookies[role])).status).toBe(canRead ? 200 : 403);
    });
  });

  it('refuses a signed-in site customer (role user) on read and write', async () => {
    const customer = await sessionCookie('user');
    expect((await call('/admin/globals/contact', customer)).status).toBe(403);
    expect((await put(customer, 'contact', { version: 0, value: {} })).status).toBe(403);
    expect((await call('/admin/globals/contact/revisions', customer)).status).toBe(403);
  });

  it('answers an unknown key with 404', async () => {
    const res = await call('/admin/globals/nope', cookies.owner);
    expect(res.status).toBe(404);
    expect((await json(res)).error.code).toBe('NOT_FOUND');
    expect((await put(cookies.owner, 'nope', { version: 0, value: {} })).status).toBe(404);
  });

  it('refuses writes while viewing as another user', async () => {
    const target = await createTestUser('admin');
    const viewing = await viewAsCookie(cookies.owner, target.id);
    const res = await put(viewing, 'contact', { version: 0, value: {} });
    expect(res.status).toBe(403);
    expect((await json(res)).error.code).toBe('IMPERSONATION_READ_ONLY');
    // Reads still work, and nothing was saved.
    expect((await call('/admin/globals/contact', viewing)).status).toBe(200);
    expect(await db.select().from(settings)).toHaveLength(0);
  });
});

describe('GET /admin/globals/:key', () => {
  it('returns the defaults at version 0 when never saved', async () => {
    const res = await call('/admin/globals/contact', cookies.owner);
    const { data } = await json(res);
    expect(data).toMatchObject({ key: 'contact', version: 0 });
    expect(data.value).toEqual(parseGlobal('contact', {}));
  });

  it('serves defaults for a malformed stored value, keeping its version', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await db.insert(settings).values({ key: 'contact', value: { email: 'bad', phone: 9 }, version: 4 });
    const { data } = await json(await call('/admin/globals/contact', cookies.owner));
    expect(data.version).toBe(4);
    expect(data.value).toEqual(parseGlobal('contact', {}));
  });
});

describe('PUT /admin/globals/:key', () => {
  const value = { email: 'hello@example.ie' };

  it('saves a validated value as a new version, attributes it and expires only that tag', async () => {
    const res = await put(cookies.owner, 'contact', { version: 0, value });
    expect(res.status).toBe(200);
    const { data } = await json(res);
    expect(data.version).toBe(1);
    expect(data.value).toMatchObject({ email: 'hello@example.ie', phone: { display: '+353 1 234 5678' } });
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([['settings:contact', { expire: 0 }]]);
    const read = await json(await call('/admin/globals/contact', cookies.owner));
    expect(read.data).toMatchObject({ version: 1, updatedBy: ownerName });
  });

  it('writes a revision holding the new value and version', async () => {
    await put(cookies.owner, 'contact', { version: 0, value });
    await put(cookies.owner, 'contact', { version: 1, value: { email: 'second@example.ie' } });
    const { data } = await json(await call('/admin/globals/contact/revisions', cookies.owner));
    expect(data.items!.map((i) => i.version)).toEqual([2, 1]);
    expect(data.items![0]!.createdByName).toBe(ownerName);
    const stored = await db.select().from(revisions).where(eq(revisions.version, 2));
    expect(stored[0]!.snapshot).toMatchObject({ email: 'second@example.ie' });
  });

  it('writes an audit row with a top-level diff', async () => {
    await put(cookies.owner, 'contact', { version: 0, value });
    await put(cookies.owner, 'contact', { version: 1, value: { email: 'second@example.ie' } });
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.action, 'globals.update'));
    expect(rows).toHaveLength(2);
    const second = rows.find((r) => (r.diff as { email?: { from: unknown } }).email?.from === 'hello@example.ie')!;
    expect(second).toMatchObject({ entityType: 'setting', entityId: 'contact', actorId: ownerId });
    // Only what changed, at the top level.
    expect(second.diff).toEqual({ email: { from: 'hello@example.ie', to: 'second@example.ie' } });
  });

  it('answers a stale version with 409, the newer version and who saved it; nothing is overwritten', async () => {
    await put(cookies.owner, 'contact', { version: 0, value });
    await put(cookies.owner, 'contact', { version: 1, value: { email: 'second@example.ie' } });
    const res = await put(cookies.admin, 'contact', { version: 1, value: { email: 'stale@example.ie' } });
    expect(res.status).toBe(409);
    const { error } = await json(res);
    expect(error.code).toBe('CONFLICT');
    expect(error.current).toMatchObject({ version: 2, updatedBy: ownerName, updatedAt: expect.any(String) });
    const [row] = await db.select().from(settings).where(eq(settings.key, 'contact'));
    expect(row).toMatchObject({ version: 2, value: { email: 'second@example.ie' } });
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledTimes(2);
  });

  it('two concurrent saves at the same version: one wins, one gets 409', async () => {
    const [a, b] = await Promise.all([
      put(cookies.owner, 'contact', { version: 0, value: { email: 'a@example.ie' } }),
      put(cookies.admin, 'contact', { version: 0, value: { email: 'b@example.ie' } }),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const winner = a.status === 200 ? 'a@example.ie' : 'b@example.ie';
    const [row] = await db.select().from(settings).where(eq(settings.key, 'contact'));
    expect(row).toMatchObject({ version: 1, value: { email: winner } });
    expect(await db.select().from(revisions).where(eq(revisions.entityId, 'contact'))).toHaveLength(1);
  });

  it('answers an invalid value with 422 and per-field messages', async () => {
    const res = await put(cookies.owner, 'contact', {
      version: 0,
      value: { email: 'nope', phone: { e164: '0123' } },
    });
    expect(res.status).toBe(422);
    const { error } = await json(res);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(error.causes!).sort()).toEqual(['email', 'phone.e164']);
    expect(await db.select().from(settings)).toHaveLength(0);
    expect(vi.mocked(revalidateTag)).not.toHaveBeenCalled();
  });

  it('enforces the per-key limits (navigation links at 7)', async () => {
    const links = Array.from({ length: 8 }, (_, i) => ({ label: `L${i}`, href: `/l${i}` }));
    const res = await put(cookies.owner, 'navigation', { version: 0, value: { links } });
    expect(res.status).toBe(422);
    expect(Object.keys((await json(res)).error.causes!)).toEqual(['links']);
  });
});

let mediaN = 0;
async function insertMedia(over: Partial<typeof media.$inferInsert> = {}) {
  mediaN += 1;
  const [row] = await db
    .insert(media)
    .values({
      driver: 'local',
      key: `vantage/media/2026/10/${String(mediaN).padStart(16, '0')}-g.png`,
      url: `/uploads/g${mediaN}.png`,
      filename: 'g.png',
      mimeType: 'image/png',
      sizeBytes: 1,
      ...over,
    })
    .returning();
  return row!;
}

describe('media refs in settings', () => {
  it('saves a live media ref', async () => {
    const logo = await insertMedia();
    const res = await put(cookies.owner, 'site', { version: 0, value: { logo: { kind: 'media', id: logo.id } } });
    expect(res.status).toBe(200);
  });

  it('refuses a soft-deleted logo with a 422 _media', async () => {
    const logo = await insertMedia({ deletedAt: new Date() });
    const res = await put(cookies.owner, 'site', { version: 0, value: { logo: { kind: 'media', id: logo.id } } });
    expect(res.status).toBe(422);
    const { error } = await json(res);
    expect(error.causes?._media).toEqual([`Image ${logo.id} no longer exists`]);
    expect(await db.select().from(settings)).toHaveLength(0);
  });

  it('refuses an enquiry-scoped upload and an unknown id', async () => {
    const photo = await insertMedia({ scope: 'enquiry' });
    const res = await put(cookies.owner, 'site', { version: 0, value: { logo: { kind: 'media', id: photo.id } } });
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes?._media).toHaveLength(1);
    const random = '5c1b0f1e-3b49-4f5e-8a53-1a0c2b9d7e11';
    const res2 = await put(cookies.owner, 'site', { version: 0, value: { logo: { kind: 'media', id: random } } });
    expect(res2.status).toBe(422);
  });

  it('keeps Cloudinary refs saveable (legacy rows, old revisions)', async () => {
    const res = await put(cookies.owner, 'site', {
      version: 0,
      value: { logo: { kind: 'cloudinary', publicId: 'p' } },
    });
    expect(res.status).toBe(200);
  });
});

describe('POST /admin/globals/:key/revisions/:rev/restore', () => {
  const restore = (cookie: string, key: string, rev: string, version: number) =>
    call(`/admin/globals/${key}/revisions/${rev}/restore`, cookie, { method: 'POST', body: { version } });

  async function twoVersions() {
    await put(cookies.owner, 'privacy', { version: 0, value: { enquiryRetentionMonths: 12 } });
    await put(cookies.owner, 'privacy', { version: 1, value: { enquiryRetentionMonths: 36 } });
    const { data } = await json(await call('/admin/globals/privacy/revisions', cookies.owner));
    return data.items!; // newest first: [v2, v1]
  }

  it('restores a snapshot as a new version with the note "Restored version N"', async () => {
    const items = await twoVersions();
    vi.mocked(revalidateTag).mockClear();
    const res = await restore(cookies.owner, 'privacy', items[1]!.id, 2);
    expect(res.status).toBe(200);
    const { data } = await json(res);
    expect(data).toMatchObject({ version: 3, value: { enquiryRetentionMonths: 12, spamRetentionDays: 30 } });
    const after = await json(await call('/admin/globals/privacy/revisions', cookies.owner));
    expect(after.data.items![0]).toMatchObject({ version: 3, note: 'Restored version 1' });
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([['settings:privacy', { expire: 0 }]]);
    const audit = await db.select().from(auditLogs).where(eq(auditLogs.summary, 'Restored version 1'));
    expect(audit).toHaveLength(1);
  });

  it('re-validates the snapshot: an old value that no longer fits is a 422', async () => {
    const items = await twoVersions();
    await db
      .update(revisions)
      .set({ snapshot: { enquiryRetentionMonths: 9999 } })
      .where(eq(revisions.id, items[1]!.id));
    const res = await restore(cookies.owner, 'privacy', items[1]!.id, 2);
    expect(res.status).toBe(422);
    expect(Object.keys((await json(res)).error.causes!)).toEqual(['enquiryRetentionMonths']);
    const [row] = await db.select().from(settings).where(eq(settings.key, 'privacy'));
    expect(row!.version).toBe(2);
  });

  it('answers a stale version with 409 and an unknown or foreign revision with 404', async () => {
    const items = await twoVersions();
    expect((await restore(cookies.owner, 'privacy', items[1]!.id, 1)).status).toBe(409);
    expect((await restore(cookies.owner, 'privacy', '00000000-0000-4000-8000-000000000000', 2)).status).toBe(404);
    // A revision of another key cannot be restored here.
    expect((await restore(cookies.owner, 'notifications', items[1]!.id, 0)).status).toBe(404);
    expect((await restore(cookies.owner, 'privacy', 'not-a-uuid', 2)).status).toBe(422);
  });

  it('needs update permission and is refused during View-as', async () => {
    const items = await twoVersions();
    expect((await restore(cookies.viewer, 'privacy', items[1]!.id, 2)).status).toBe(403);
    const target = await createTestUser('admin');
    const as = await viewAsCookie(cookies.owner, target.id);
    expect((await restore(as, 'privacy', items[1]!.id, 2)).status).toBe(403);
  });

  describe('legacy Cloudinary refs', () => {
    it('maps a ref whose legacy_source exists to a media ref and keeps unknown ones', async () => {
      const copied = await insertMedia({ legacySource: 'cloudinary:image:p' });
      await put(cookies.owner, 'site', {
        version: 0,
        value: { logo: { kind: 'cloudinary', publicId: 'p' }, favicon: { kind: 'cloudinary', publicId: 'unknown' } },
      });
      await put(cookies.owner, 'site', { version: 1, value: {} });
      const { data } = await json(await call('/admin/globals/site/revisions', cookies.owner));
      const res = await restore(cookies.owner, 'site', data.items![1]!.id, 2);
      expect(res.status).toBe(200);
      const saved = (await json(res)).data.value;
      expect(saved.logo).toEqual({ kind: 'media', id: copied.id });
      expect(saved.favicon).toEqual({ kind: 'cloudinary', publicId: 'unknown' });
    });

    it('looks a hero video up as cloudinary:video:<id>, not image', async () => {
      const image = await insertMedia({ legacySource: 'cloudinary:image:v' });
      const video = await insertMedia({ legacySource: 'cloudinary:video:v', mimeType: 'video/mp4' });
      const ref = { kind: 'cloudinary', publicId: 'v' };
      await put(cookies.owner, 'page.home', { version: 0, value: { hero: { video: ref, fallbackImage: ref } } });
      await put(cookies.owner, 'page.home', { version: 1, value: {} });
      const { data } = await json(await call('/admin/globals/page.home/revisions', cookies.owner));
      const res = await restore(cookies.owner, 'page.home', data.items![1]!.id, 2);
      expect(res.status).toBe(200);
      const hero = (await json(res)).data.value.hero as { video: unknown; fallbackImage: unknown };
      expect(hero.video).toEqual({ kind: 'media', id: video.id });
      expect(hero.fallbackImage).toEqual({ kind: 'media', id: image.id });
    });

    it('does not map to a soft-deleted copy', async () => {
      await insertMedia({ legacySource: 'cloudinary:image:p', deletedAt: new Date() });
      await put(cookies.owner, 'site', { version: 0, value: { logo: { kind: 'cloudinary', publicId: 'p' } } });
      await put(cookies.owner, 'site', { version: 1, value: {} });
      const { data } = await json(await call('/admin/globals/site/revisions', cookies.owner));
      const res = await restore(cookies.owner, 'site', data.items![1]!.id, 2);
      expect((await json(res)).data.value.logo).toEqual({ kind: 'cloudinary', publicId: 'p' });
    });
  });
});
