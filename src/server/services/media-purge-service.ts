import 'server-only';

import { and, asc, count, eq, gt, isNull, lte, sql } from 'drizzle-orm';

import { serverEnv } from '@/lib/env';
import { db, type DbLike } from '@/server/db';
import { media, mediaObjectPurges, settings, type MediaPurgeReason } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import { getStorage, mediaKeyPattern } from '@/server/lib/media/storage';

// A replaced or deleted file stays in storage this long, so a restored backup or a stale cache
// never points at nothing.
export const PURGE_GRACE_DAYS = 30;
const DAY_MS = 86_400_000;
const BATCH = 100;

// Queue a storage key for removal. A key is queued once; queuing it again changes nothing.
export async function enqueueMediaPurge(
  key: string,
  reason: MediaPurgeReason,
  dbLike: DbLike = db,
  now: Date = new Date(),
) {
  await dbLike
    .insert(mediaObjectPurges)
    .values({ key, reason, dueAt: new Date(now.getTime() + PURGE_GRACE_DAYS * DAY_MS) })
    .onConflictDoNothing();
}

export async function countDuePurges(now: Date = new Date()): Promise<number> {
  const [row] = await db.select({ n: count() }).from(mediaObjectPurges).where(lte(mediaObjectPurges.dueAt, now));
  return row?.n ?? 0;
}

// Anything that still points at this key: a live media row, or a setting whose JSON names it.
// Checked again at purge time, in the same transaction that removes the file.
async function stillReferenced(tx: DbLike, key: string): Promise<boolean> {
  const [live] = await tx
    .select({ id: media.id })
    .from(media)
    .where(and(eq(media.key, key), isNull(media.deletedAt)))
    .limit(1);
  if (live) return true;
  const [setting] = await tx
    .select({ key: settings.key })
    .from(settings)
    .where(sql`${settings.value}::text like ${`%${key.replace(/[\\%_]/g, '\\$&')}%`}`)
    .limit(1);
  return Boolean(setting);
}

export type PurgeResult = { purged: number; kept: number; failed: number };

// Removes every queued file that is due and unreferenced. Idempotent: a removed key leaves the
// queue, a failed one stays for the next run, and a second run finds nothing. Batched by key.
export async function purgeMediaObjects(now: Date = new Date()): Promise<PurgeResult> {
  const pattern = mediaKeyPattern(serverEnv().MEDIA_KEY_PREFIX);
  const storage = getStorage();
  const result: PurgeResult = { purged: 0, kept: 0, failed: 0 };
  let after = '';
  for (;;) {
    const batch = await db
      .select({ key: mediaObjectPurges.key })
      .from(mediaObjectPurges)
      .where(and(lte(mediaObjectPurges.dueAt, now), gt(mediaObjectPurges.key, after)))
      .orderBy(asc(mediaObjectPurges.key))
      .limit(BATCH);
    if (batch.length === 0) break;
    for (const { key } of batch) {
      after = key;
      try {
        await db.transaction(async (tx) => {
          // Lock the queue row so two runs never act on the same key.
          const [row] = await tx
            .select({ key: mediaObjectPurges.key })
            .from(mediaObjectPurges)
            .where(and(eq(mediaObjectPurges.key, key), lte(mediaObjectPurges.dueAt, now)))
            .for('update', { skipLocked: true });
          if (!row) return;
          // Outside the vantage/ prefix, or still in use: never touch the file, just stop queuing it.
          if (!pattern.test(key) || (await stillReferenced(tx, key))) {
            await tx.delete(mediaObjectPurges).where(eq(mediaObjectPurges.key, key));
            result.kept++;
            return;
          }
          await storage.remove(key);
          await tx.delete(mediaObjectPurges).where(eq(mediaObjectPurges.key, key));
          result.purged++;
        });
      } catch {
        result.failed++;
      }
    }
  }
  if (result.purged > 0) {
    await audit(null, {
      action: 'media.purge',
      entityType: 'media',
      summary: `Removed ${result.purged} stored file${result.purged === 1 ? '' : 's'} past the ${PURGE_GRACE_DAYS}-day grace period`,
    });
  }
  if (result.failed > 0) console.error(`[media] could not purge ${result.failed} queued files; they stay queued`);
  return result;
}
