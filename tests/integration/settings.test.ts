import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { parseGlobal } from '@/lib/content/globals';
import { revisions, siteSettings } from '@/server/db/schema';
import { listRevisions, REVISION_LIMITS, writeRevision } from '@/server/lib/revisions';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { siteSettingsService } from '@/server/services/site-settings-service';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

describe('settings repository', () => {
  beforeEach(async () => {
    await db.execute(sql`truncate table settings, revisions`);
  });

  it('inserts at version 1 when absent and version is 0', async () => {
    const res = await settingsRepository.save('site', { version: 0, value: { a: 1 } }, null);
    expect(res.version).toBe(1);
    const row = await settingsRepository.get('site');
    expect(row?.value).toEqual({ a: 1 });
    expect(row?.version).toBe(1);
  });

  it('returns null for a missing key', async () => {
    expect(await settingsRepository.get('nope')).toBeNull();
  });

  it('rejects insert when absent and version is not 0', async () => {
    await expect(settingsRepository.save('site', { version: 3, value: {} }, null)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
      message: 'Someone else saved a moment ago',
    });
  });

  it('saveSetting rejects stale version', async () => {
    await settingsRepository.save('site', { version: 0, value: { a: 1 } }, null);
    const second = await settingsRepository.save('site', { version: 1, value: { a: 2 } }, null);
    expect(second.version).toBe(2);
    await expect(settingsRepository.save('site', { version: 1, value: { a: 3 } }, null)).rejects.toMatchObject({
      status: 409,
      message: 'Someone else saved a moment ago',
    });
    expect((await settingsRepository.get('site'))?.value).toEqual({ a: 2 });
  });

  it('writes a revision holding the new value and version on every save, including the first', async () => {
    await settingsRepository.save('site', { version: 0, value: { a: 1 } }, null);
    await settingsRepository.save('site', { version: 1, value: { a: 2 } }, null, 'edit');
    const { items } = await listRevisions(db, 'setting', 'site');
    expect(items.map((i) => i.version)).toEqual([2, 1]);
    expect(items[0]).toMatchObject({ version: 2, note: 'edit' });
    const rows = await db.select().from(revisions).where(eq(revisions.entityId, 'site'));
    const byVersion = new Map(rows.map((r) => [r.version, r.snapshot]));
    expect(byVersion.get(1)).toEqual({ a: 1 });
    expect(byVersion.get(2)).toEqual({ a: 2 });
  });

  it('a stale save returns who holds the newer version', async () => {
    await settingsRepository.save('site', { version: 0, value: { a: 1 } }, null);
    await settingsRepository.save('site', { version: 1, value: { a: 2 } }, null);
    await expect(settingsRepository.save('site', { version: 1, value: { a: 3 } }, null)).rejects.toMatchObject({
      status: 409,
      current: { version: 2, updatedBy: null, updatedAt: expect.any(String) },
    });
    await expect(settingsRepository.save('fresh', { version: 4, value: {} }, null)).rejects.toMatchObject({
      status: 409,
      current: { version: 0, updatedAt: null, updatedBy: null },
    });
  });

  it('runs onSaved in the save transaction: a failing hook rolls the save back', async () => {
    await expect(
      settingsRepository.save('site', { version: 0, value: { a: 1 } }, null, undefined, async () => {
        throw new Error('hook failed');
      }),
    ).rejects.toThrow('hook failed');
    expect(await settingsRepository.get('site')).toBeNull();
    expect((await listRevisions(db, 'setting', 'site')).items).toHaveLength(0);
  });

  it('restore re-saves a revision snapshot as a new version', async () => {
    await settingsRepository.save('site', { version: 0, value: { a: 1 } }, null);
    await settingsRepository.save('site', { version: 1, value: { a: 2 } }, null);
    const { items } = await listRevisions(db, 'setting', 'site');
    // Newest first: items[1] is version 1, holding { a: 1 }.
    const res = await settingsRepository.restore('site', items[1]!.id, null);
    expect(res.version).toBe(3);
    expect((await settingsRepository.get('site'))?.value).toEqual({ a: 1 });
    expect((await listRevisions(db, 'setting', 'site')).items[0]).toMatchObject({
      version: 3,
      note: 'Restored version 1',
    });
  });

  it('restore of unknown revision is 404', async () => {
    await expect(
      settingsRepository.restore('site', '00000000-0000-0000-0000-000000000000', null),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('prunes revisions beyond the limit', async () => {
    for (let v = 1; v <= REVISION_LIMITS.setting + 5; v++) {
      await writeRevision(db, { entityType: 'setting', entityId: 'k', version: v, snapshot: { v } });
    }
    const { items } = await listRevisions(db, 'setting', 'k');
    expect(items).toHaveLength(REVISION_LIMITS.setting);
    expect(items[0]!.version).toBe(REVISION_LIMITS.setting + 5);
  });
});

describe('settings text actor ids', () => {
  beforeEach(async () => {
    await db.execute(sql`truncate table settings, revisions`);
  });

  it('stores non-uuid actor ids and surfaces them as revision authors', async () => {
    await settingsRepository.save('site', { version: 0, value: { a: 1 } }, 'user_abc123');
    expect((await settingsRepository.get('site'))?.updatedBy).toBe('user_abc123');
    await settingsRepository.save('site', { version: 1, value: { a: 2 } }, 'user_abc123');
    const { items } = await listRevisions(db, 'setting', 'site');
    expect(items[0]!.createdBy).toBe('user_abc123');
  });

  it('restores with a non-null actor', async () => {
    await settingsRepository.save('site', { version: 0, value: { a: 1 } }, 'user_abc123');
    await settingsRepository.save('site', { version: 1, value: { a: 2 } }, 'user_abc123');
    const { items } = await listRevisions(db, 'setting', 'site');
    const res = await settingsRepository.restore('site', items[1]!.id, 'user_xyz789');
    expect(res.version).toBe(3);
    const row = await settingsRepository.get('site');
    expect(row?.updatedBy).toBe('user_xyz789');
    expect(row?.value).toEqual({ a: 1 });
  });
});

describe('public settings with legacy row', () => {
  beforeEach(async () => {
    await db.execute(sql`truncate table settings, revisions, site_settings cascade`);
  });

  it('a site_settings row with business_name "Legacy Name" and a stored site key "New Name" -> public name "New Name"', async () => {
    await db.insert(siteSettings).values({
      id: 1,
      businessName: 'Legacy Name',
      phone: '01 234 5678',
      email: 'info@example.com',
      address: 'Dublin',
      openingHours: 'Mon-Fri',
    });
    await settingsRepository.save('site', { version: 0, value: parseGlobal('site', { name: 'New Name' }) }, null);
    const pub = await siteSettingsService.getPublic();
    expect(pub.businessName).toBe('New Name');
  });

  it('with no stored site key -> schema default, never "Legacy Name"', async () => {
    await db.insert(siteSettings).values({
      id: 1,
      businessName: 'Legacy Name',
      phone: '01 234 5678',
      email: 'info@example.com',
      address: 'Dublin',
      openingHours: 'Mon-Fri',
    });
    const pub = await siteSettingsService.getPublic();
    // No name saved: the site's domain stands in.
    expect(pub.businessName).toBe('localhost');
    expect(pub.businessName).not.toBe('Legacy Name');
  });
});
