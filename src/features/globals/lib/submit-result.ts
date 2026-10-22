import type { SubmitResult } from '@/components/admin/schema-form/helpers';

import { GlobalApiError } from '../services/api';

export const CONFLICT_MESSAGE =
  'Someone else saved this a moment ago. Their version is loaded; make your change again.';

export const isConflict = (error: unknown): error is GlobalApiError =>
  error instanceof GlobalApiError && error.status === 409;

// What the form shows for a failed save. A conflict is expected (someone else
// got there first); a validation failure maps onto the fields. Anything else
// returns null: the caller rethrows and SchemaForm shows its generic message.
export function submitResultFromError(error: unknown): SubmitResult | null {
  if (isConflict(error)) return { formError: CONFLICT_MESSAGE };
  if (error instanceof GlobalApiError) {
    return { formError: error.message, ...(error.causes ? { fieldErrors: error.causes } : {}) };
  }
  return null;
}
