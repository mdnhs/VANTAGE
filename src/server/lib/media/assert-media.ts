import 'server-only';

import { and, inArray, isNull } from 'drizzle-orm';

import { db, type DbLike } from '@/server/db';
import { media } from '@/server/db/schema/media';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Every id a save names must be a live (not soft-deleted) media row.
export async function assertMediaExists(ids: string[], dbLike: DbLike = db): Promise<void> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return;
  const wellFormed = unique.filter((id) => UUID.test(id));
  const found = new Set<string>();
  if (wellFormed.length > 0) {
    const rows = await dbLike
      .select({ id: media.id })
      .from(media)
      .where(and(inArray(media.id, wellFormed), isNull(media.deletedAt)));
    for (const row of rows) found.add(row.id);
  }
  const missing = unique.filter((id) => !found.has(id.toLowerCase()));
  if (missing.length === 0) return;
  throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Some images were deleted. Choose new ones before saving.', 422, {
    _media: missing.map((id) => `Image ${id} no longer exists`),
  });
}
