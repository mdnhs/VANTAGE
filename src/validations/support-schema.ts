import { z } from 'zod';

export const SUPPORT_MESSAGE_MAX = 2000;

const body = z
  .string()
  .trim()
  .min(1, 'Write a message first')
  .max(SUPPORT_MESSAGE_MAX, `Keep it under ${SUPPORT_MESSAGE_MAX} characters`);

export const supportMessageSchema = z.object({ body });

export const supportStartSchema = z.object({
  body,
  name: z.string().trim().max(120).optional(),
  sourcePath: z.string().trim().max(500).optional(),
  // Honeypot: hidden from people, filled in by bots.
  website: z.string().max(200).optional(),
});

export const supportVisitorContactSchema = z.object({
  email: z.email('Enter a valid email address').max(254),
  name: z.string().trim().max(120).optional(),
});

export const supportListQuerySchema = z.object({
  status: z.enum(['open', 'closed']).default('open'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const supportAssignSchema = z.object({ userId: z.string().min(1).nullable() });

export type SupportListQuery = z.infer<typeof supportListQuerySchema>;
export type SupportStartInput = z.infer<typeof supportStartSchema>;
export type SupportVisitorContactInput = z.infer<typeof supportVisitorContactSchema>;
