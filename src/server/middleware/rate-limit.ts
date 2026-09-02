import { createMiddleware } from 'hono/factory';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';

const buckets = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (limit = 20, windowMs = 60_000) =>
  createMiddleware(async (c, next) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? c.req.header('x-real-ip') ?? 'unknown';
    const key = `${c.req.path}:${ip}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else if (++bucket.count > limit) {
      throw new ApiError(ERROR_CODES.RATE_LIMITED, 'Too many requests', 429);
    }

    await next();
  });
