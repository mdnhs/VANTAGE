import { z } from 'zod';

export const createHomepageProcessStepSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  isHighlighted: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

export const updateHomepageProcessStepSchema = createHomepageProcessStepSchema.partial();

export const homepageProcessStepListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const reorderHomepageProcessStepsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateHomepageProcessStepInput = z.infer<typeof createHomepageProcessStepSchema>;
export type UpdateHomepageProcessStepInput = z.infer<typeof updateHomepageProcessStepSchema>;
export type HomepageProcessStepListQuery = z.infer<typeof homepageProcessStepListQuerySchema>;
export type ReorderHomepageProcessStepsInput = z.infer<typeof reorderHomepageProcessStepsSchema>;
