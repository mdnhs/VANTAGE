import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { ApiError } from '@/server/lib/errors';

export interface AuthUser {
  id: string;
  email: string;
  permissions: string[];
}

export type AuthEnv = { Variables: { user: AuthUser } };

// TODO: implement — verify the signed session cookie / JWT and read the claims.
//
// COST-CRITICAL: resolve the user from the token payload alone. Do NOT query the users
// table here. This middleware runs on every authenticated request, so a lookup turns each
// page view into a Neon wake-up and prevents the endpoint from ever suspending.
// Put id, email and permission bits in the signed token; re-issue it when they change
// (see the session-invalidation pattern) and hit the database only on login.
const resolveUser = async (_c: Context): Promise<AuthUser | null> => null;

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const user = await resolveUser(c);
  if (!user) throw ApiError.unauthorized();
  c.set('user', user);
  await next();
});

export const requirePermission = (permission: string) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user?.permissions.includes(permission)) throw ApiError.forbidden();
    await next();
  });
