import { zValidator as zv } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';

// 422 with per-field messages, keyed by dotted path ('_' for the root).
export function invalid(error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] }) {
  const causes: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_';
    (causes[key] ??= []).push(issue.message);
  }
  return new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 422, causes);
}

export const zValidator = <T extends ZodSchema>(target: 'json' | 'query' | 'param' | 'form', schema: T) =>
  zv(target, schema, (result) => {
    if (!result.success) throw invalid(result.error);
  });
