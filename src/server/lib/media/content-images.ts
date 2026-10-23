import 'server-only';

import type { PublicImage } from '@/lib/media/public-image';
import type { MediaRow } from '@/server/db/schema/media';

import { db, type DbLike } from '@/server/db';

import { assertMediaExists, assertMediaExistsLocked } from './assert-media';
import { toPublicImage } from './resolve';

// A content row's image: the live media row, else the legacy Cloudinary id
// (until Phase 11), else nothing.
export function contentImage(
  row: MediaRow | null | undefined,
  legacyPublicId: string | null | undefined,
): PublicImage | null {
  return toPublicImage(row, legacyPublicId ? { publicId: legacyPublicId, resourceType: 'image' } : null);
}

type Pair = readonly [mediaKey: string, legacyKey: string];

// Writing any `xMediaId` key (even null) clears its paired legacy column, so a
// removed image can never reappear through the Cloudinary fallback. Every
// non-null id must name a live media row (422 `_media` otherwise).
export async function prepareMediaWrite<T extends object>(data: T, pairs: readonly Pair[]): Promise<T> {
  const record = data as Record<string, unknown>;
  const out: Record<string, unknown> = { ...record };
  const ids: string[] = [];
  for (const [mediaKey, legacyKey] of pairs) {
    if (record[mediaKey] === undefined) continue;
    out[legacyKey] = null;
    if (typeof record[mediaKey] === 'string') ids.push(record[mediaKey]);
  }
  await assertMediaExists(ids);
  return out as T;
}

// Non-null ids named by a prepared write, for the in-transaction re-check.
export function mediaIdsOf(data: object, pairs: readonly Pair[]): string[] {
  const record = data as Record<string, unknown>;
  return pairs.flatMap(([mediaKey]) => (typeof record[mediaKey] === 'string' ? [record[mediaKey] as string] : []));
}

// Runs the write in a transaction that first re-checks the images under the lock that
// excludes a concurrent media delete (P5 M1). `prepareMediaWrite` stays as the fast pre-check.
export async function writeWithMedia<R>(ids: string[], write: (tx: DbLike) => Promise<R>): Promise<R> {
  if (ids.length === 0) return write(db);
  return db.transaction(async (tx) => {
    await assertMediaExistsLocked(tx, ids);
    return write(tx);
  });
}
