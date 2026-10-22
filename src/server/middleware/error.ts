import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { fail } from '@/server/lib/response';

export const onError: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    if (err.status === 503) c.header('Retry-After', '5');
    return fail(c, err.code, err.message, err.status as never, err.causes, err.current, err.details);
  }

  if (err instanceof HTTPException) {
    return fail(c, ERROR_CODES.INTERNAL_ERROR, err.message, err.status as never);
  }

  // Unknown error: log the real thing server-side, return a generic message.
  console.error('[api] unhandled error', {
    path: c.req.path,
    method: c.req.method,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  return fail(c, ERROR_CODES.INTERNAL_ERROR, 'Something went wrong', 500);
};

export const onNotFound: NotFoundHandler = (c) => fail(c, ERROR_CODES.NOT_FOUND, 'Route not found', 404);
