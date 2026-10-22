import { z } from 'zod';

// Optional URL that also accepts an empty string (cleared field in a form), normalized to
// `undefined` so it is dropped from the payload rather than stored as `''`.
const optionalUrl = z
  .union([z.string().url(), z.literal('')])
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

const partnerLogoBase = z.object({
  companyName: z.string().min(1).max(120),
  logoPublicId: z.string().min(1).max(255).nullable().optional(),
  logoMediaId: z.string().uuid().nullable().optional(),
  websiteUrl: optionalUrl,
  displayOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

// Until Phase 11 drops the legacy column a logo needs a media id or a legacy id.
export const createPartnerLogoSchema = partnerLogoBase.refine((v) => v.logoMediaId || v.logoPublicId, {
  message: 'Choose a logo',
  path: ['logoPublicId'],
});

export const updatePartnerLogoSchema = partnerLogoBase.partial().extend({
  logoMediaId: z.string().uuid().optional(),
  logoPublicId: z.string().min(1).max(255).optional(),
});

export const partnerLogoListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const reorderPartnerLogosSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreatePartnerLogoInput = z.infer<typeof createPartnerLogoSchema>;
export type UpdatePartnerLogoInput = z.infer<typeof updatePartnerLogoSchema>;
export type PartnerLogoListQuery = z.infer<typeof partnerLogoListQuerySchema>;
export type ReorderPartnerLogosInput = z.infer<typeof reorderPartnerLogosSchema>;
