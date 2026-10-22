import { ApiError } from '@/server/lib/errors';

export const CONFLICT_MESSAGE = 'Someone else saved a moment ago';

export function conflictError() {
  return new ApiError('CONFLICT', CONFLICT_MESSAGE, 409);
}
