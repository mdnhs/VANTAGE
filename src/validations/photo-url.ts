import { z } from 'zod';

export const PHOTO_TYPES_MESSAGE = 'Photos must be JPG, PNG, WebP or AVIF images';

// A customer photo sent as a data URL. Other image types (HEIC, GIF, SVG) are refused with a
// clear field error instead of being dropped silently.
export const photoDataUrlSchema = z
  .string()
  .startsWith('data:image/')
  .max(30_000_000)
  .refine((value) => /^data:image\/(jpeg|png|webp|avif);base64,/.test(value.slice(0, 40)), PHOTO_TYPES_MESSAGE);
