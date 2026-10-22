import * as z from 'zod';

const RANGE_MESSAGE = 'The end date must be on or after the start date';

// Keeps the Irish-day maths (Date.UTC maps years 0-99 to 1900-1999) well inside sane bounds.
const day = z.iso
  .date()
  .refine((d) => d >= '1900-01-01' && d <= '2100-12-31', { message: 'Choose a date between 1900 and 2100' });

const filters = {
  actor: z.string().min(1).max(64).optional(),
  action: z.string().max(64).optional(),
  entityType: z.string().max(32).optional(),
  entityId: z.string().max(64).optional(),
  from: day.optional(),
  to: day.optional(),
};

const rangeOk = (q: { from?: string; to?: string }) => !q.from || !q.to || q.from <= q.to;
const range = { message: RANGE_MESSAGE, path: ['to'] };

export const AuditListQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    ...filters,
  })
  .refine(rangeOk, range);
export type AuditListQuery = z.output<typeof AuditListQuery>;

export const AuditExportQuery = z.object(filters).refine(rangeOk, range);
export type AuditExportQuery = z.output<typeof AuditExportQuery>;
