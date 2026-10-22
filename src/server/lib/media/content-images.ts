import 'server-only';

import type { PublicImage } from '@/lib/media/public-image';
import type { MediaRow } from '@/server/db/schema/media';

import { assertMediaExists } from './assert-media';
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
