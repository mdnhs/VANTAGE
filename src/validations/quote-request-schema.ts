import { z } from 'zod';

// The 8 canonical workflow pipeline states from the specification
export const PIPELINE_STATUSES = [
  'new',
  'contacted',
  'waiting_response',
  'quote_sent',
  'approved',
  'in_progress',
  'completed',
  'cancelled',
] as const;

// Include legacy statuses for backward compatibility with existing records
export const ALL_QUOTE_STATUSES = [...PIPELINE_STATUSES, 'quoted', 'archived'] as const;

export const QUOTE_STATUSES = ALL_QUOTE_STATUSES;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];
export type QuoteStatus = (typeof ALL_QUOTE_STATUSES)[number];

// Real-world intake channels
export const QUOTE_SOURCES = [
  'website',
  'phone_call',
  'whatsapp',
  'walk_in',
  'email',
  'social_media',
  'quote_page',
  'homepage_estimator',
  'contact_modal',
] as const;

export type QuoteSource = (typeof QUOTE_SOURCES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'partially_paid', 'paid_in_full'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ['card', 'cash', 'bank_transfer', 'insurance_billing'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const createQuoteRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(5, 'Valid phone number is required').max(50),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  eircode: z.string().max(20).nullable().optional(),
  registration: z.string().max(40).nullable().optional(),
  make: z.string().max(80).nullable().optional(),
  model: z.string().max(80).nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  serviceType: z.string().max(120).nullable().optional(),
  description: z.string().max(3000).nullable().optional(),
  photoUrls: z.array(z.string()).max(6).optional(),
  source: z.enum(QUOTE_SOURCES).optional().default('website'),
  status: z.enum(ALL_QUOTE_STATUSES).optional().default('new'),
  assignedAdminId: z.string().uuid().nullable().optional(),
  inspectionDate: z.coerce.date().nullable().optional(),
  estimatedCost: z.coerce.number().min(0).nullable().optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional().default('unpaid'),
  paidAmount: z.coerce.number().min(0).nullable().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
  invoiceNumber: z.string().max(60).nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  adminNotes: z.string().max(5000).nullable().optional(),
});

export const updateQuoteRequestSchema = z.object({
  status: z.enum(ALL_QUOTE_STATUSES).optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  eircode: z.string().max(20).nullable().optional(),
  assignedAdminId: z.string().uuid().nullable().optional(),
  inspectionDate: z.coerce.date().nullable().optional(),
  estimatedCost: z.coerce.number().min(0).nullable().optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  paidAmount: z.coerce.number().min(0).nullable().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
  invoiceNumber: z.string().max(60).nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  adminNotes: z.string().max(5000).nullable().optional(),
});

export const quoteRequestListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum([...ALL_QUOTE_STATUSES, 'all']).default('all'),
  search: z.string().optional(),
  assignedAdminId: z.string().uuid().optional(),
});

export type CreateQuoteRequestInput = z.input<typeof createQuoteRequestSchema>;
export type CreateQuoteRequestOutput = z.infer<typeof createQuoteRequestSchema>;
export type UpdateQuoteRequestInput = z.input<typeof updateQuoteRequestSchema>;
export type UpdateQuoteRequestOutput = z.infer<typeof updateQuoteRequestSchema>;
export type QuoteRequestListQuery = z.infer<typeof quoteRequestListQuerySchema>;
