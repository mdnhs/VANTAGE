export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number = 400,
    readonly causes?: Record<string, string[]>,
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
}
