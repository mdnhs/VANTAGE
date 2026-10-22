import 'server-only';

import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db, type DbLike } from '@/server/db';
import { media } from '@/server/db/schema/media';
import { isShareImageSize, SHARE_IMAGE_MESSAGE } from '@/lib/seo/share-image';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isMediaId = (id: string) => UUID.test(id);

// Every id a save names must be a live (not soft-deleted) library media row;
// anonymous enquiry uploads (scope 'enquiry') are never valid references.
//
// Known gap (not closed on purpose): this check runs before the content write, outside the
// referrer-table lock that `mediaLibraryService.remove` holds. A delete committing in that
// window leaves a reference to a soft-deleted row, which renders as no image (or the legacy
// URL). Closing it means threading one transaction through every content service and
// repository (services, catalogs, logos, projects, testimonials, globals), which is not small.
export async function assertMediaExists(ids: string[], dbLike: DbLike = db): Promise<void> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return;
  const wellFormed = unique.filter(isMediaId);
  const found = new Set<string>();
  if (wellFormed.length > 0) {
    const rows = await dbLike
      .select({ id: media.id })
      .from(media)
      .where(and(inArray(media.id, wellFormed), isNull(media.deletedAt), eq(media.scope, 'library')));
    for (const row of rows) found.add(row.id);
  }
  const missing = unique.filter((id) => !found.has(id.toLowerCase()));
  if (missing.length === 0) return;
  throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Some images were deleted. Choose new ones before saving.', 422, {
    _media: missing.map((id) => `Image ${id} no longer exists`),
  });
}

// A custom share image must be at least 1200×630 at 1.91:1 (docs/brief.md §11). Media whose
// dimensions are unknown is allowed; a missing row is assertMediaExists's job.
export async function assertShareImage(
  ref: { kind: string; id?: string } | null | undefined,
  field: string,
  dbLike: DbLike = db,
): Promise<void> {
  if (ref?.kind !== 'media' || !ref.id || !isMediaId(ref.id)) return;
  const [row] = await dbLike
    .select({ width: media.width, height: media.height, mimeType: media.mimeType })
    .from(media)
    .where(eq(media.id, ref.id))
    .limit(1);
  if (!row) return;
  const known = row.width !== null && row.height !== null;
  const ok = row.mimeType.startsWith('image/') && (!known || isShareImageSize({ width: row.width!, height: row.height! }));
  if (!ok) throw new ApiError(ERROR_CODES.VALIDATION_ERROR, SHARE_IMAGE_MESSAGE, 422, { [field]: [SHARE_IMAGE_MESSAGE] });
}
