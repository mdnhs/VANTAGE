export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  LAST_OWNER: 'LAST_OWNER',
  IMPERSONATION_READ_ONLY: 'IMPERSONATION_READ_ONLY',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Who holds the newest version of a conflicted document (sent with a 409).
export type ConflictCurrent = { version: number; updatedAt: string | null; updatedBy: string | null };

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number = 400,
    readonly causes?: Record<string, string[]>,
    readonly current?: ConflictCurrent,
    // Structured payload for clients (e.g. the usage list of a 409).
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(ERROR_CODES.FORBIDDEN, message, 403);
  }
  static notFound(message = 'Not found') {
    return new ApiError(ERROR_CODES.NOT_FOUND, message, 404);
  }
  static conflict(message = 'Conflict') {
    return new ApiError(ERROR_CODES.CONFLICT, message, 409);
  }
  // 409: there must always be at least one active owner.
  static lastOwner(message = 'There must always be at least one owner') {
    return new ApiError(ERROR_CODES.LAST_OWNER, message, 409);
  }
  // 403: View-as shows what a role can see; it never changes anything.
  static impersonationReadOnly(message: string) {
    return new ApiError(ERROR_CODES.IMPERSONATION_READ_ONLY, message, 403);
  }
  static payloadTooLarge(message: string) {
    return new ApiError(ERROR_CODES.PAYLOAD_TOO_LARGE, message, 413);
  }
  static unsupportedMediaType(message: string) {
    return new ApiError(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE, message, 415);
  }
  static serviceUnavailable(message: string) {
    return new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, message, 503);
  }
}
