import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { inArray } from 'drizzle-orm';

import { MEDIA_TAG } from '@/lib/cache/media-tag';
import type { PublicImage } from '@/lib/media/public-image';
import { db } from '@/server/db';
import { media, type MediaRow } from '@/server/db/schema/media';

import { isMediaId } from './assert-media';

// A live media row becomes a PublicImage; with a soft-deleted or missing row,
// there is no image.
export function toPublicImage(row: MediaRow | null | undefined, _legacy?: unknown): PublicImage | null {
  if (!row || row.deletedAt) return null;
  return {
    id: row.id,
    src: row.url,
    mimeType: row.mimeType,
    width: row.width,
    height: row.height,
    alt: row.isDecorative ? '' : row.alt,
    blurDataUrl: row.blurDataUrl,
    focal: { x: row.focalX, y: row.focalY },
  };
}

async function loadSorted(ids: string[]): Promise<Record<string, PublicImage>> {
  'use cache';
  cacheTag(MEDIA_TAG);
  cacheLife('max');
  if (ids.length === 0) return {};
  const rows = await db.select().from(media).where(inArray(media.id, ids));
  const out: Record<string, PublicImage> = {};
  for (const row of rows) {
    const image = toPublicImage(row);
    if (image) out[row.id] = image;
  }
  return out;
}

// Live media rows by id as PublicImages. Ids are sorted and deduped first so
// equal sets share one cache entry; malformed ids (a bad value in settings JSON)
// are dropped so they can never make the query throw. A failed query returns an
// empty map outside the cache, so the fallback never outlives the outage.
export async function loadPublicImages(ids: string[]): Promise<Record<string, PublicImage>> {
  try {
    return await loadSorted([...new Set(ids.filter(isMediaId).map((id) => id.toLowerCase()))].sort());
  } catch (error) {
    console.warn(
      '[loadSorted] db query failed, returning empty image map:',
      error instanceof Error ? error.message : error,
    );
    return {};
  }
}
