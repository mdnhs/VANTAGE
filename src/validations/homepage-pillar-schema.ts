import { z } from 'zod';

export const HOMEPAGE_PILLAR_ICONS = [
  'factory',
  'flame',
  'headset',
  'timer',
  'wrench',
  'shield',
  'star',
  'clock',
  'car',
  'sparkles',
] as const;

export type HomepagePillarIcon = (typeof HOMEPAGE_PILLAR_ICONS)[number];

export const createHomepagePillarSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  icon: z.enum(HOMEPAGE_PILLAR_ICONS),
  displayOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

export const updateHomepagePillarSchema = createHomepagePillarSchema.partial();

export const homepagePillarListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const reorderHomepagePillarsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateHomepagePillarInput = z.infer<typeof createHomepagePillarSchema>;
export type UpdateHomepagePillarInput = z.infer<typeof updateHomepagePillarSchema>;
export type HomepagePillarListQuery = z.infer<typeof homepagePillarListQuerySchema>;
export type ReorderHomepagePillarsInput = z.infer<typeof reorderHomepagePillarsSchema>;
