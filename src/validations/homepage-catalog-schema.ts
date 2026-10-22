import { z } from 'zod';

import { legacyImageKey } from './legacy-image-key';

export const HOMEPAGE_CATALOG_ICONS = [
  'car-front',
  'bandage',
  'paint-roller',
  'palette',
  'wand2',
  'wrench',
  'disc',
  'shield-check',
  'car',
  'sparkles',
  'shield',
  'flame',
] as const;

export type HomepageCatalogIcon = (typeof HOMEPAGE_CATALOG_ICONS)[number];

const homepageCatalogBase = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  description: z.string().min(1, 'Description is required').max(2000),
  badge: z.string().max(80).nullable().optional(),
  footnote: z.string().max(80).optional(),
  icon: z.enum(HOMEPAGE_CATALOG_ICONS).optional(),
  iconMediaId: z.string().uuid().nullable().optional(),
  iconPublicId: legacyImageKey('iconMediaId'),
  displayOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

// Defaults apply on create only: a partial update must never reset a field it leaves out.
export const createHomepageCatalogSchema = homepageCatalogBase.extend({
  footnote: z.string().max(80).optional().default('Free Estimate'),
  icon: z.enum(HOMEPAGE_CATALOG_ICONS).default('car-front'),
});

export const updateHomepageCatalogSchema = homepageCatalogBase.partial();

export const homepageCatalogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const reorderHomepageCatalogsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateHomepageCatalogInput = z.infer<typeof createHomepageCatalogSchema>;
export type UpdateHomepageCatalogInput = z.infer<typeof updateHomepageCatalogSchema>;
export type HomepageCatalogListQuery = z.infer<typeof homepageCatalogListQuerySchema>;
export type ReorderHomepageCatalogsInput = z.infer<typeof reorderHomepageCatalogsSchema>;
