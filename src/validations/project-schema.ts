import { z } from 'zod';

// lowercase-kebab: letters/digits, hyphen-separated, no leading/trailing/double hyphens.
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const projectStatusValues = ['draft', 'published'] as const;

export const createProjectSchema = z.object({
  title: z.string().min(1).max(160),
  slug: z.string().min(1).max(180).regex(slugPattern, 'Must be lowercase kebab-case (e.g. bmw-3-series-respray)'),
  vehicleModel: z.string().min(1).max(120),
  serviceCategory: z.string().min(1).max(80),
  beforeImagePublicId: z.string().min(1).max(255),
  afterImagePublicId: z.string().min(1).max(255),
  description: z.string().min(1),
  completedAt: z.coerce.date().nullable().optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(projectStatusValues).optional(),
  displayOrder: z.number().int().optional(),
  // Plain public_id array in the input DTO — the repository turns this into child rows.
  galleryImagePublicIds: z.array(z.string().min(1).max(255)).max(20).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

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
