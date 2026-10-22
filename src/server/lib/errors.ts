export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
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
