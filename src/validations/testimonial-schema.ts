import { z } from 'zod';

import { legacyImageKey } from './legacy-image-key';

export const testimonialStatusValues = ['published', 'hidden'] as const;

const testimonialBase = z.object({
  customerName: z.string().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().min(1),
  avatarMediaId: z.string().uuid().nullable().optional(),
  avatarPublicId: legacyImageKey('avatarMediaId'),
  serviceReceived: z.string().min(1).max(120).nullable().optional(),
  receivedAt: z.coerce.date().nullable().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(testimonialStatusValues).optional(),
  displayOrder: z.number().int().optional(),
});

// Defaults apply on create only: a partial update must never reset a field it leaves out.
export const createTestimonialSchema = testimonialBase.extend({ isFeatured: z.boolean().default(false) });

export const updateTestimonialSchema = testimonialBase.partial();

export const testimonialListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(testimonialStatusValues).optional(),
  featuredOnly: z.coerce.boolean().optional(),
});

export const testimonialStatusSchema = z.object({
  status: z.enum(testimonialStatusValues),
});

export const reorderTestimonialsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
export type TestimonialListQuery = z.infer<typeof testimonialListQuerySchema>;
export type TestimonialStatusInput = z.infer<typeof testimonialStatusSchema>;
export type ReorderTestimonialsInput = z.infer<typeof reorderTestimonialsSchema>;
