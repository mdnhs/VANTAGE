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
