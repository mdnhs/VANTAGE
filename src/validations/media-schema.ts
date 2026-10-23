import { z } from 'zod';

export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(40),
  type: z.enum(['image', 'video', 'pdf']).optional(),
  // `z.coerce.boolean()` would turn "false" into true, so parse the string.
  missingAlt: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  q: z.string().trim().max(80).optional(),
  // Comma-separated ids, so the picker can load the items a field already holds.
  ids: z
    .string()
    .transform((v) =>
      v
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().uuid()).max(100))
    .optional(),
});

export const mediaPatchSchema = z
  .object({
    alt: z.string().trim().max(300),
    caption: z.string().trim().max(500).nullable(),
    focalX: z.number().min(0).max(1),
    focalY: z.number().min(0).max(1),
    isDecorative: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to change');

export const mediaIdParamSchema = z.object({ id: z.string().uuid() });

export type MediaListQuery = z.output<typeof mediaListQuerySchema>;
export type MediaPatch = z.output<typeof mediaPatchSchema>;
