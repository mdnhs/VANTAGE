import { z } from 'zod';

import { legacyImageKey } from './legacy-image-key';

// lowercase-kebab: letters/digits, hyphen-separated, no leading/trailing/double hyphens.
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const projectStatusValues = ['draft', 'published'] as const;

const projectBase = z.object({
  title: z.string().min(1).max(160),
  slug: z.string().min(1).max(180).regex(slugPattern, 'Must be lowercase kebab-case (e.g. bmw-3-series-respray)'),
  vehicleModel: z.string().min(1).max(120),
  serviceCategory: z.string().min(1).max(80),
  beforeImageMediaId: z.string().uuid({ message: 'Choose a before image' }),
  afterImageMediaId: z.string().uuid({ message: 'Choose an after image' }),
  beforeImagePublicId: legacyImageKey('beforeImageMediaId'),
  afterImagePublicId: legacyImageKey('afterImageMediaId'),
  galleryImagePublicIds: legacyImageKey('galleryMediaIds'),
  description: z.string().min(1),
  completedAt: z.coerce.date().nullable().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(projectStatusValues).optional(),
  displayOrder: z.number().int().optional(),
  // Ordered media ids. When given they replace the whole gallery (legacy rows included);
  // leaving it out keeps the gallery as it is.
  galleryMediaIds: z.array(z.string().uuid()).max(10).optional(),
});

// Defaults apply on create only: a partial update must never reset a field it leaves out.
export const createProjectSchema = projectBase.extend({ isFeatured: z.boolean().default(false) });

// Leaving an image out keeps the current one (including a legacy one).
export const updateProjectSchema = projectBase.partial();

export const projectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(projectStatusValues).optional(),
  featuredOnly: z.coerce.boolean().optional(),
});

export const projectStatusSchema = z.object({
  status: z.enum(projectStatusValues),
});

export const reorderProjectsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
export type ProjectStatusInput = z.infer<typeof projectStatusSchema>;
export type ReorderProjectsInput = z.infer<typeof reorderProjectsSchema>;
