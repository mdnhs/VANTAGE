import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { inArray } from 'drizzle-orm';

import { MEDIA_TAG } from '@/lib/cache/media-tag';
import type { PublicImage } from '@/lib/media/public-image';
import { db } from '@/server/db';
import { media, type MediaRow } from '@/server/db/schema/media';

import { legacyCloudinaryUrl, type LegacyRef } from './legacy-cloudinary';

// A live row wins; a soft-deleted or missing row falls back to the legacy
// Cloudinary URL (until Phase 11); with neither, there is no image.
export function toPublicImage(row: MediaRow | null | undefined, legacy?: LegacyRef | null): PublicImage | null {
  if (row && !row.deletedAt) {
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
  const src = legacy ? legacyCloudinaryUrl(legacy) : null;
  if (!src) return null;
  return {
    id: null,
    src,
    mimeType: null,
    width: null,
    height: null,
    alt: '',
    blurDataUrl: null,
    focal: { x: 0.5, y: 0.5 },
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
// equal sets share one cache entry.
export async function loadPublicImages(ids: string[]): Promise<Record<string, PublicImage>> {
  return loadSorted([...new Set(ids)].sort());
}
