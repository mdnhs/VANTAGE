import { zValidator as zv } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';

export const zValidator = <T extends ZodSchema>(target: 'json' | 'query' | 'param' | 'form', schema: T) =>
  zv(target, schema, (result) => {
    if (!result.success) {
      const causes: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        (causes[key] ??= []).push(issue.message);
      }
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 422, causes);
    }
  });
