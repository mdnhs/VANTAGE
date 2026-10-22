import { z } from 'zod';

// Stored reference to an image or video. Legacy assets still live on Cloudinary
// (by public id); Phase 5 converts every ref to `media` (R2 media library row).
const cloudinaryRef = z.object({ kind: z.literal('cloudinary'), publicId: z.string().min(1) });
const mediaRef = z.object({ kind: z.literal('media'), id: z.uuid() });

export const imageRefSchema = z.discriminatedUnion('kind', [cloudinaryRef, mediaRef]).nullable();
export const videoRefSchema = z.discriminatedUnion('kind', [cloudinaryRef, mediaRef]).nullable();

export type ImageRef = z.infer<typeof imageRefSchema>;
export type VideoRef = z.infer<typeof videoRefSchema>;

export function cloudinaryImage(publicId: string | null | undefined): ImageRef {
  return publicId ? { kind: 'cloudinary', publicId } : null;
}

type Ref = NonNullable<ImageRef>;

function asRef(value: unknown): Ref | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind === 'media' && typeof v.id === 'string') return { kind: 'media', id: v.id };
  if (v.kind === 'cloudinary' && typeof v.publicId === 'string') return { kind: 'cloudinary', publicId: v.publicId };
  return null;
}

// Deep-replaces every image/video ref in a settings document. `path` is the key path
// to the ref (array indices as strings), so callers can tell a `…'video'` slot apart.
export function mapRefs(value: unknown, fn: (ref: Ref, path: string[]) => ImageRef, path: string[] = []): unknown {
  const ref = asRef(value);
  if (ref) return fn(ref, path);
  if (Array.isArray(value)) return value.map((item, i) => mapRefs(item, fn, [...path, String(i)]));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapRefs(v, fn, [...path, k])]));
  }
  return value;
}

// Every media-library id a settings document names (deduped, document order).
export function collectMediaIds(value: unknown): string[] {
  const ids = new Set<string>();
  mapRefs(value, (ref) => {
    if (ref.kind === 'media') ids.add(ref.id);
    return ref;
  });
  return [...ids];
}
