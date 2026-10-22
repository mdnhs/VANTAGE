import 'server-only';

import { ApiError, ERROR_CODES } from '@/server/lib/errors';
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
  const filename = cleanFilename(file.name);
  return { filename, processed: await processUpload(Buffer.from(await file.arrayBuffer()), filename) };
}

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

export const mediaLibraryService = {
  async upload(actorId: string | null, file: File): Promise<MediaItem> {
    const { filename, processed } = await readUpload(file);
    // A concurrent identical upload can take the key between the check and the
    // insert: retry once under a fresh variant key.
    for (let attempt = 0; ; attempt++) {
      const { storage, key } = await store(processed);
      try {
        const row = await mediaRepository.insert({ ...columns(processed, filename, storage, key), createdBy: actorId });
        return toItem(row);
      } catch (error) {
        if (!isUniqueViolation(error) || attempt > 0) throw error;
      }
    }
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

  async update(id: string, patch: MediaPatch): Promise<MediaItem> {
    const row = await mediaRepository.update(id, {
      ...patch,
      ...(patch.alt !== undefined && { needsAlt: false }),
    });
    if (!row) throw ApiError.notFound(NOT_FOUND);
    return toItem(row);
  },

  // Keeps the id (and so every reference); the file moves to a new immutable key.
  async replace(_actorId: string | null, id: string, file: File): Promise<MediaItem> {
    const current = await mediaRepository.byId(id);
    if (!current) throw ApiError.notFound(NOT_FOUND);
    const { filename, processed } = await readUpload(file);
    if (kindOf(current.mimeType) !== kindOf(processed.mimeType)) {
      const message = 'Replace an image with an image, a video with a video, a PDF with a PDF';
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 422, { file: [message] });
    }
    const { storage, key } = await store(processed);
    try {
      const row = await mediaRepository.update(id, columns(processed, filename, storage, key));
      if (!row) throw ApiError.notFound(NOT_FOUND);
      return toItem(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw ApiError.conflict('That file is already in the library');
      throw error;
    }
  },

  // Soft delete: old content may still name the id.
  async remove(id: string) {
    if (!(await mediaRepository.softDelete(id))) throw ApiError.notFound(NOT_FOUND);
  },

  // Phase 5 fills this with real references.
  async usageOf(id: string): Promise<never[]> {
    await mediaLibraryService.get(id);
    return [];
  },
};
