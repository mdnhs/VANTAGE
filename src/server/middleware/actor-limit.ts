import { createMiddleware } from 'hono/factory';

import type { AppEnv } from '@/server/api/types';
import { ERROR_CODES } from '@/server/lib/errors';
import { hitLimit } from '@/server/lib/rate-limit-db';
import { fail } from '@/server/lib/response';

// Per signed-in user, in Postgres. Place after the guard, so refused calls cost nothing.
export const INVITE_LIMIT = { limit: 20, windowMs: 60 * 60_000 };
export const VIEW_AS_LIMIT = { limit: 10, windowMs: 10 * 60_000 };

export const actorLimit = (name: string, opts: { limit: number; windowMs: number }) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const actor = c.get('actor');
    if (!actor) return next();
    const { allowed, retryAfterSec } = await hitLimit(`${name}:user:${actor.userId}`, opts);
    if (!allowed) {
      c.header('Retry-After', String(retryAfterSec));
      return fail(c, ERROR_CODES.RATE_LIMITED, 'Too many requests. Wait a moment and try again.', 429);
    }
    await next();
  });
