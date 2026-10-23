import 'server-only';

import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db, type DbLike } from '@/server/db';
import { media } from '@/server/db/schema/media';
import { isShareImageSize, SHARE_IMAGE_MESSAGE } from '@/lib/seo/share-image';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { MEDIA_REFERRER_TABLES } from '@/server/lib/media/usage';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isMediaId = (id: string) => UUID.test(id);

// Every id a save names must be a live (not soft-deleted) library media row;
// anonymous enquiry uploads (scope 'enquiry') are never valid references.
//
// The pre-check form runs outside any lock; a save's real guarantee is `assertMediaExistsLocked`,
// called inside the write transaction (see `writeWithMedia`).
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

// Save-versus-delete: `mediaLibraryService.remove` holds SHARE ROW EXCLUSIVE on every referrer
// table while it checks usage and soft-deletes. Taking ROW EXCLUSIVE on the same tables here
// conflicts with that, so either the delete commits first (the re-check below fails with the
// media 422) or this transaction commits first (the delete's usage check sees the new
// reference and fails with 409). Concurrent saves do not block one another.
export async function assertMediaExistsLocked(tx: DbLike, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await tx.execute(sql.raw(`lock table ${MEDIA_REFERRER_TABLES.join(', ')} in row exclusive mode`));
  await assertMediaExists(ids, tx);
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
