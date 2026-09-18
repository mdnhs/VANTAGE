import { z } from 'zod';

export const CONTACT_STATUSES = ['new', 'read', 'replied', 'archived'] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const createContactMessageSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(5, 'Valid phone number is required').max(50),
  service: z.string().max(120).nullable().optional(),
  message: z.string().min(1, 'Message is required').max(5000),
  photoUrls: z.array(z.string()).optional(),
  source: z.enum(['contact_page', 'footer', 'general']).optional().default('contact_page'),
});

export const updateContactMessageSchema = z.object({
  status: z.enum(CONTACT_STATUSES).optional(),
  adminNotes: z.string().max(5000).nullable().optional(),
});

export const contactMessageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum([...CONTACT_STATUSES, 'all']).default('all'),
  search: z.string().optional(),
});

export type CreateContactMessageInput = z.input<typeof createContactMessageSchema>;
export type UpdateContactMessageInput = z.infer<typeof updateContactMessageSchema>;
export type ContactMessageListQuery = z.infer<typeof contactMessageListQuerySchema>;
