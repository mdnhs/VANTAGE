import 'server-only';

import { revalidateTag } from 'next/cache';

import { topLevelDiff } from '@/lib/audit/top-level-diff';
import { MEDIA_TAG } from '@/lib/cache/media-tag';
import { hasPermission } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { MEDIA_REFERRER_TABLES, mediaUsage } from '@/server/lib/media/usage';
import { cleanFilename, MAX_VIDEO_BYTES, processUpload, type ProcessedUpload } from '@/server/lib/media/process';
import { getStorage, variantKey } from '@/server/lib/media/storage';
import { mediaRepository } from '@/server/repositories/media-repository';
import type { MediaRow } from '@/server/db/schema/media';
import type { MediaListQuery, MediaPatch } from '@/validations/media-schema';

const toItem = (row: MediaRow) => ({
  id: row.id,
  url: row.url,
  filename: row.filename,
  mimeType: row.mimeType,
  sizeBytes: row.sizeBytes,
  width: row.width,
  height: row.height,
  blurDataUrl: row.blurDataUrl,
  dominantColor: row.dominantColor,
  alt: row.alt,
  caption: row.caption,
  focalX: row.focalX,
  focalY: row.focalY,
  isDecorative: row.isDecorative,
  needsAlt: row.needsAlt,
  createdBy: row.createdBy,
  createdAt: row.createdAt,
});

export type MediaItem = ReturnType<typeof toItem>;

const NOT_FOUND = 'File not found';

// Drizzle wraps driver errors; the Postgres code may sit on `cause`.
const isUniqueViolation = (error: unknown): boolean => {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === '23505' || e?.cause?.code === '23505';
};

const kindOf = (mimeType: string) => (mimeType === 'application/pdf' ? 'pdf' : mimeType.split('/')[0]);

async function readUpload(file: File) {
  // Cheap early refusal; processUpload checks the real byte count per type.
  if (file.size > MAX_VIDEO_BYTES) throw ApiError.payloadTooLarge('Videos can be up to 100 MB');
  return processBytes(Buffer.from(await file.arrayBuffer()), file.name);
}

async function processBytes(bytes: Buffer, name: string) {
  const filename = cleanFilename(name);
  return { filename, processed: await processUpload(bytes, filename) };
}

// An author whose only media-granting role is `author` edits only their own files.
function ownFilesOnly(actor: Actor) {
  return !actor.roles.some((role) => role !== 'author' && hasPermission([role], { media: ['update'] }));
}

function assertCanChange(actor: Actor, row: MediaRow) {
  if (ownFilesOnly(actor) && row.createdBy !== actor.userId) {
    throw ApiError.forbidden('You can only edit your own files');
  }
}

const expire = () => revalidateTag(MEDIA_TAG, { expire: 0 });

export type IngestInput = {
  bytes: Buffer;
  filename: string;
  actorId: string | null;
  scope: 'library' | 'enquiry';
  legacySource?: string;
  focal?: { x: number; y: number };
};

// Identical bytes under the same name hash to the same key. A new upload never
// inherits the existing row, so a duplicate gets a variant key of its own.
async function store(processed: ProcessedUpload) {
  const storage = getStorage();
  const key = (await mediaRepository.keyExists(processed.key)) ? variantKey(processed.key) : processed.key;
  await storage.put(key, processed.body, processed.mimeType);
  return { storage, key };
}

const columns = (
  processed: ProcessedUpload,
  filename: string,
  storage: { name: 'local' | 's3'; urlFor(k: string): string },
  key: string,
) => ({
  driver: storage.name,
  key,
  url: storage.urlFor(key),
  filename,
  mimeType: processed.mimeType,
  sizeBytes: processed.sizeBytes,
  width: processed.width,
  height: processed.height,
  blurDataUrl: processed.blurDataUrl,
  dominantColor: processed.dominantColor,
});

// A migration key whose row was deleted in the library is never handed back: the caller
// must decide (the Cloudinary migration reports it) rather than relink to a deleted file.
export class DeletedLegacySourceError extends Error {
  constructor(readonly mediaId: string) {
    super(`That legacy source belongs to deleted media row ${mediaId}`);
  }
}
const liveSource = (row: MediaRow) => {
  if (row.deletedAt) throw new DeletedLegacySourceError(row.id);
  return row;
};

export const mediaLibraryService = {
  // Process + store + insert. With a `legacySource` that already has a row, that
  // row comes back untouched, so the Cloudinary migration can be re-run safely.
  async ingest(input: IngestInput): Promise<MediaRow> {
    if (input.legacySource) {
      const existing = await mediaRepository.byLegacySource(input.legacySource);
      if (existing) return liveSource(existing);
    }
    const { filename, processed } = await processBytes(input.bytes, input.filename);
    // A concurrent identical upload can take the key between the check and the
    // insert: retry once under a fresh variant key.
    for (let attempt = 0; ; attempt++) {
      const { storage, key } = await store(processed);
      try {
        return await mediaRepository.insert({
          ...columns(processed, filename, storage, key),
          scope: input.scope,
          createdBy: input.actorId,
          legacySource: input.legacySource ?? null,
          ...(input.focal && { focalX: input.focal.x, focalY: input.focal.y }),
        });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        if (input.legacySource) {
          const raced = await mediaRepository.byLegacySource(input.legacySource);
          if (raced) return liveSource(raced);
        }
        if (attempt > 0) throw error;
      }
    }
  },

  async upload(actor: Actor, file: File): Promise<MediaItem> {
    if (file.size > MAX_VIDEO_BYTES) throw ApiError.payloadTooLarge('Videos can be up to 100 MB');
    const row = await mediaLibraryService.ingest({
      bytes: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      actorId: actor.userId,
      scope: 'library',
    });
    await audit(actor, {
      action: 'media.upload',
      entityType: 'media',
      entityId: row.id,
      summary: `Uploaded ${row.filename}`,
    });
    expire();
    return toItem(row);
  },

  async list(query: MediaListQuery) {
    const { rows, total } = await mediaRepository.list(query);
    return { items: rows.map(toItem), total };
  },

  async get(id: string): Promise<MediaItem> {
    const row = await mediaRepository.byId(id);
    if (!row) throw ApiError.notFound(NOT_FOUND);
    return toItem(row);
  },

  async update(actor: Actor, id: string, patch: MediaPatch): Promise<MediaItem> {
    const current = await mediaRepository.byId(id);
    if (!current) throw ApiError.notFound(NOT_FOUND);
    assertCanChange(actor, current);
    const row = await mediaRepository.update(id, {
      ...patch,
      ...(patch.alt !== undefined && { needsAlt: false }),
    });
    if (!row) throw ApiError.notFound(NOT_FOUND);
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    for (const key of Object.keys(patch) as (keyof MediaPatch)[]) {
      before[key] = current[key];
      after[key] = row[key];
    }
    await audit(actor, {
      action: 'media.update',
      entityType: 'media',
      entityId: id,
      summary: `Updated ${row.filename}`,
      diff: topLevelDiff(before, after),
    });
    expire();
    return toItem(row);
  },

  // Keeps the id (and so every reference); the file moves to a new immutable key.
  async replace(actor: Actor, id: string, file: File): Promise<MediaItem> {
    const current = await mediaRepository.byId(id);
    if (!current) throw ApiError.notFound(NOT_FOUND);
    assertCanChange(actor, current);
    const { filename, processed } = await readUpload(file);
    if (kindOf(current.mimeType) !== kindOf(processed.mimeType)) {
      const message = 'Replace an image with an image, a video with a video, a PDF with a PDF';
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 422, { file: [message] });
    }
    const { storage, key } = await store(processed);
    let row: MediaRow | undefined;
    try {
      row = await mediaRepository.update(id, columns(processed, filename, storage, key));
    } catch (error) {
      if (isUniqueViolation(error)) throw ApiError.conflict('That file is already in the library');
      throw error;
    }
    if (!row) throw ApiError.notFound(NOT_FOUND);
    await audit(actor, {
      action: 'media.replace',
      entityType: 'media',
      entityId: id,
      summary: `Replaced ${current.filename} with ${row.filename}`,
      diff: { key: { from: current.key, to: row.key } },
    });
    expire();
    return toItem(row);
  },

  // Soft delete: old content may still name the id. The usage check runs under a
  // share-row-exclusive lock on every referrer table, so no reference can be
  // written between the check and the delete.
  async remove(actor: Actor, id: string) {
    const filename = await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`lock table ${MEDIA_REFERRER_TABLES.join(', ')} in share row exclusive mode`));
      const row = await mediaRepository.byId(id, tx);
      if (!row) throw ApiError.notFound(NOT_FOUND);
      assertCanChange(actor, row);
      const usage = await mediaUsage(tx, id);
      if (usage.length > 0) {
        throw new ApiError(ERROR_CODES.CONFLICT, 'This file is still in use', 409, undefined, undefined, { usage });
      }
      await mediaRepository.softDelete(id, tx);
      await audit(
        actor,
        { action: 'media.delete', entityType: 'media', entityId: id, summary: `Deleted ${row.filename}` },
        tx,
      );
      return row.filename;
    });
    expire();
    return filename;
  },

  async usageOf(id: string) {
    await mediaLibraryService.get(id);
    return mediaUsage(db, id);
  },

  // Anonymous form photos whose lead is gone: the row, then the stored file.
  // Storage failures are best-effort and reported as a count only.
  async hardDeleteEnquiryMedia(ids: string[]): Promise<number> {
    const keys = await mediaRepository.deleteUnlinkedEnquiry(ids);
    const storage = getStorage();
    const results = await Promise.allSettled(keys.map((key) => storage.remove(key)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) console.error(`[media] could not remove ${failed} of ${keys.length} enquiry files from storage`);
    return keys.length;
  },
};

export const hardDeleteEnquiryMedia = mediaLibraryService.hardDeleteEnquiryMedia;
