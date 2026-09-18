import { z } from 'zod';

export const QUOTE_STATUSES = ['new', 'contacted', 'in_progress', 'quoted', 'completed', 'archived'] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const createQuoteRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(5, 'Valid phone number is required').max(50),
  registration: z.string().max(40).nullable().optional(),
  make: z.string().max(80).nullable().optional(),
  model: z.string().max(80).nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  serviceType: z.string().max(120).nullable().optional(),
  description: z.string().max(3000).nullable().optional(),
  photoUrls: z.array(z.string()).max(6).optional(),
  source: z.enum(['website', 'quote_page', 'homepage_estimator', 'contact_modal']).optional().default('website'),
});

export const updateQuoteRequestSchema = z.object({
  status: z.enum(QUOTE_STATUSES).optional(),
  estimatedCost: z.coerce.number().min(0).nullable().optional(),
  adminNotes: z.string().max(5000).nullable().optional(),
});

export const quoteRequestListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum([...QUOTE_STATUSES, 'all']).default('all'),
  search: z.string().optional(),
});

export type CreateQuoteRequestInput = z.input<typeof createQuoteRequestSchema>;
export type UpdateQuoteRequestInput = z.infer<typeof updateQuoteRequestSchema>;
export type QuoteRequestListQuery = z.infer<typeof quoteRequestListQuerySchema>;
