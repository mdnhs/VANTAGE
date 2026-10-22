import { z } from 'zod';

// A legacy Cloudinary image key sent by an old client is refused with a clear 422
// instead of being silently dropped. Any value (even null) fails; leaving it out passes.
export const legacyImageKey = (use: string) =>
  z.never({ error: `Legacy image ids are no longer accepted. Use ${use}.` }).optional();
