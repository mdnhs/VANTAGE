import { z } from 'zod';

import { legacyImageKey } from './legacy-image-key';

// lowercase-kebab: letters/digits, hyphen-separated, no leading/trailing/double hyphens.
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createServiceSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).regex(slugPattern, 'Must be lowercase kebab-case (e.g. crash-repair)'),
  description: z.string().min(1),
  iconMediaId: z.string().uuid().nullable().optional(),
  iconPublicId: legacyImageKey('iconMediaId'),
  imagePublicId: legacyImageKey('imageMediaId'),
  imageMediaId: z.string().uuid().nullable().optional(),
  checklist: z.array(z.string().min(1).max(160)).max(10).optional(),
  startingPrice: z.number().int().nonnegative().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const serviceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  enabledOnly: z.coerce.boolean().optional(),
});

export const reorderServicesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;
export type ReorderServicesInput = z.infer<typeof reorderServicesSchema>;
