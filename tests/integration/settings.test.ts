import { beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { listRevisions, REVISION_LIMITS, writeRevision } from '@/server/lib/revisions';
import { settingsRepository } from '@/server/repositories/settings-repository';

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

  it('writes a revision of the previous value on update', async () => {
    await settingsRepository.save('site', { version: 0, value: { a: 1 } }, null);
    await settingsRepository.save('site', { version: 1, value: { a: 2 } }, null, 'edit');
    const { items } = await listRevisions(db, 'setting', 'site');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ version: 1, note: 'edit' });
  });

  it('restore re-saves a revision snapshot as a new version', async () => {
    await settingsRepository.save('site', { version: 0, value: { a: 1 } }, null);
    await settingsRepository.save('site', { version: 1, value: { a: 2 } }, null);
    const { items } = await listRevisions(db, 'setting', 'site');
    const res = await settingsRepository.restore('site', items[0]!.id, null);
    expect(res.version).toBe(3);
    expect((await settingsRepository.get('site'))?.value).toEqual({ a: 1 });
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
    const res = await settingsRepository.restore('site', items[0]!.id, 'user_xyz789');
    expect(res.version).toBe(3);
    const row = await settingsRepository.get('site');
    expect(row?.updatedBy).toBe('user_xyz789');
    expect(row?.value).toEqual({ a: 1 });
  });
});
