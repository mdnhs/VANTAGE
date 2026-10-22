import { createMiddleware } from 'hono/factory';

import type { AppEnv } from '@/server/api/types';
import { ApiError } from '@/server/lib/errors';

// View-as shows what a role can see; it never changes anyone's access or
// account. Place after a guard (needs the actor).
export const notViewingAs = (message: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (c.get('actor')?.impersonatedBy) throw ApiError.impersonationReadOnly(message);
    await next();
  });
