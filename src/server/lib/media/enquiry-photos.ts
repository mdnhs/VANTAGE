import 'server-only';

import { asc, eq, inArray } from 'drizzle-orm';

import type { EnquiryPhoto } from '@/lib/media/enquiry-photo';
import { db } from '@/server/db';
import { enquiryPhotos, media } from '@/server/db/schema';
import { ApiError } from '@/server/lib/errors';
import { sniff } from '@/server/lib/media/sniff';
import { mediaLibraryService } from '@/server/services/media-library-service';

type Db = typeof db;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export const MAX_ENQUIRY_PHOTOS = 4;
export const MAX_ENQUIRY_PHOTO_BYTES = 20 * 1024 * 1024;

const DATA_URL = /^data:image\/(jpeg|png|webp|avif);base64,/;
const EXT: Record<string, string> = { jpeg: 'jpg', png: 'png', webp: 'webp', avif: 'avif' };

// Public forms send photos as data URLs. Each accepted one goes through the media pipeline
// (sniff, re-encode, R2) as an anonymous enquiry-scope file. A refused or failed photo is
// skipped so the enquiry still saves; only a count is logged, never customer data.
export async function storeEnquiryPhotos(dataUrls: string[] | undefined): Promise<string[]> {
  const candidates = (dataUrls ?? []).slice(0, MAX_ENQUIRY_PHOTOS);
  const ids: string[] = [];
  let skipped = 0;
  let busy = 0;
  for (const dataUrl of candidates) {
    const match = DATA_URL.exec(dataUrl);
    const base64 = match ? dataUrl.slice(match[0].length) : '';
    if (!match || Math.floor((base64.length * 3) / 4) > MAX_ENQUIRY_PHOTO_BYTES) {
      skipped++;
      continue;
    }
    const bytes = Buffer.from(base64, 'base64');
    // The real bytes decide: an image of the declared type, never a renamed PDF or video.
    const real = bytes.length > 0 && bytes.length <= MAX_ENQUIRY_PHOTO_BYTES ? sniff(bytes) : null;
    if (!real || real.ext !== EXT[match[1]!]) {
      skipped++;
      continue;
    }
    const input = { bytes, filename: `enquiry-photo.${real.ext}`, actorId: null, scope: 'enquiry' as const };
    try {
      let row;
      try {
        row = await mediaLibraryService.ingest(input);
      } catch (error) {
        // Busy processing slot (503): one retry, then skip.
        if (!(error instanceof ApiError) || error.status !== 503) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500));
        row = await mediaLibraryService.ingest(input);
      }
      ids.push(row.id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) busy++;
      else skipped++;
    }
  }
  if (skipped > 0) console.error(`[enquiry-photos] ${skipped} of ${candidates.length} photos skipped`);
  if (busy > 0) console.error(`[enquiry-photos] ${busy} of ${candidates.length} photos skipped: server busy`);
  return ids;
}

export type EnquiryParent = { quoteRequestId: string } | { contactMessageId: string };

// Inside the create transaction, so a lead never exists with half its photos linked.
export async function linkEnquiryPhotos(tx: Tx, parent: EnquiryParent, mediaIds: string[]): Promise<void> {
  if (mediaIds.length === 0) return;
  await tx.insert(enquiryPhotos).values(mediaIds.map((mediaId, position) => ({ ...parent, mediaId, position })));
}

type Parent = 'quoteRequestId' | 'contactMessageId';

// Linked media (by position) followed by the legacy `photo_urls` strings (id null).
export async function attachPhotos<T extends { id: string; photoUrls: string[] | null }>(
  parent: Parent,
  rows: T[],
): Promise<(Omit<T, 'photoUrls'> & { photos: EnquiryPhoto[] })[]> {
  const links =
    rows.length === 0
      ? []
      : await db
          .select({
            parentId: enquiryPhotos[parent],
            id: media.id,
            url: media.url,
            width: media.width,
            height: media.height,
          })
          .from(enquiryPhotos)
          .innerJoin(media, eq(media.id, enquiryPhotos.mediaId))
          .where(
            inArray(
              enquiryPhotos[parent],
              rows.map((r) => r.id),
            ),
          )
          .orderBy(asc(enquiryPhotos.position));
  return rows.map(({ photoUrls, ...row }) => ({
    ...row,
    photos: [
      ...links
        .filter((l) => l.parentId === row.id)
        .map(({ id, url, width, height }): EnquiryPhoto => ({ id, url, width, height })),
      ...(photoUrls ?? []).map((url): EnquiryPhoto => ({ id: null, url, width: null, height: null })),
    ],
  }));
}
