import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, media, mediaObjectPurges, users } from '@/server/db/schema';
import { resetStorageForTests } from '@/server/lib/media/storage';
import { mediaLibraryService } from '@/server/services/media-library-service';
import { countDuePurges, purgeMediaObjects } from '@/server/services/media-purge-service';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
}));

const UPLOAD_DIR = path.resolve('.test-uploads');
const DAY = 86_400_000;
const actor = { userId: 'u1', email: 'a@example.com', roles: ['owner'] } as never;

const png = (color: string) =>
  sharp({ create: { width: 40, height: 40, channels: 3, background: color } }).png().toBuffer();
const file = async (color: string, name: string) =>
  new File([new Uint8Array(await png(color))], name, { type: 'image/png' });
const onDisk = (key: string) => existsSync(path.join(UPLOAD_DIR, key));

const original = { ...process.env };
beforeAll(() => {
  process.env.MEDIA_DRIVER = 'local';
  process.env.MEDIA_LOCAL_DIR = UPLOAD_DIR;
  resetStorageForTests();
});
afterAll(async () => {
  process.env = original;
  resetStorageForTests();
  await rm(UPLOAD_DIR, { recursive: true, force: true });
});
beforeEach(async () => {
  await db.execute(sql`truncate table media_object_purges, audit_logs, media, users cascade`);
  await db.insert(users).values({ id: 'u1', name: 'Owner', email: 'a@example.com', role: 'owner' });
});

describe('media purge queue', () => {
  it('replace queues the old key for 30 days; purge removes it only once due', async () => {
    const item = await mediaLibraryService.upload(actor, await file('#f00', 'a.png'));
    const [before] = await db.select().from(media).where(eq(media.id, item.id));
    await mediaLibraryService.replace(actor, item.id, await file('#0f0', 'b.png'));
    const [queued] = await db.select().from(mediaObjectPurges);
    expect(queued?.key).toBe(before!.key);
    expect(queued?.reason).toBe('replaced');
    const days = (queued!.dueAt.getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);

    const now = new Date();
    expect(await countDuePurges(now)).toBe(0);
    expect((await purgeMediaObjects(now)).purged).toBe(0);
    expect(onDisk(before!.key)).toBe(true);

    const later = new Date(now.getTime() + 31 * DAY);
    expect(await countDuePurges(later)).toBe(1);
    expect((await purgeMediaObjects(later)).purged).toBe(1);
    expect(onDisk(before!.key)).toBe(false);
    expect(await db.select().from(mediaObjectPurges)).toHaveLength(0);
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, 'media.purge'));
    expect(logs).toHaveLength(1);
    // idempotent
    expect((await purgeMediaObjects(later)).purged).toBe(0);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'media.purge'))).toHaveLength(1);
    // the new file is untouched
    const [after] = await db.select().from(media).where(eq(media.id, item.id));
    expect(onDisk(after!.key)).toBe(true);
  });

  it('soft delete queues the file; the media row stays with deleted_at', async () => {
    const item = await mediaLibraryService.upload(actor, await file('#00f', 'c.png'));
    const [row] = await db.select().from(media).where(eq(media.id, item.id));
    await mediaLibraryService.remove(actor, item.id);
    const [queued] = await db.select().from(mediaObjectPurges);
    expect(queued?.reason).toBe('deleted');
    await purgeMediaObjects(new Date(Date.now() + 31 * DAY));
    expect(onDisk(row!.key)).toBe(false);
    const [kept] = await db.select().from(media).where(eq(media.id, item.id));
    expect(kept?.deletedAt).not.toBeNull();
  });

  it('skips and unqueues a key a live row still uses, and a key outside the prefix', async () => {
    const item = await mediaLibraryService.upload(actor, await file('#ff0', 'd.png'));
    const [row] = await db.select().from(media).where(eq(media.id, item.id));
    await db.insert(mediaObjectPurges).values([
      { key: row!.key, reason: 'replaced', dueAt: new Date(Date.now() - DAY) },
      { key: 'other/media/2026/10/0123456789abcdef-x.png', reason: 'deleted', dueAt: new Date(Date.now() - DAY) },
    ]);
    const r = await purgeMediaObjects();
    expect(r).toMatchObject({ purged: 0, kept: 2 });
    expect(onDisk(row!.key)).toBe(true);
    expect(await db.select().from(mediaObjectPurges)).toHaveLength(0);
  });
});
