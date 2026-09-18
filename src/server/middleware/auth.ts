import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { ApiError } from '@/server/lib/errors';
import { SESSION_COOKIE, verifySessionToken } from '@/server/lib/session';
import { decompressPermissions } from '@/lib/permission/utils';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

export type AuthEnv = { Variables: { user: AuthUser } };

// COST-CRITICAL: resolve the user from the token payload alone. Do NOT query the users
// table here. This middleware runs on every authenticated request, so a lookup turns each
// page view into a Neon wake-up and prevents the endpoint from ever suspending.
// id, email and compressed permission bits live in the signed cookie; the database is only
// hit on login (see src/server/api/auth.ts).
const resolveUser = async (c: Context): Promise<AuthUser | null> => {
  const token = getCookie(c, SESSION_COOKIE);
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    permissions: decompressPermissions(payload.permissions),
  };
};

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
