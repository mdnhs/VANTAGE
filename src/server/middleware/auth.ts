import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { hasPermission, isAdminRole, type Permissions } from '@/lib/auth/permissions';
import type { AppEnv } from '@/server/api/types';
import { toActor, type Actor } from '@/server/lib/auth/actor';
import { getFreshSession } from '@/server/lib/auth/fresh-session';
import { ApiError } from '@/server/lib/errors';

// COST-CRITICAL: the session is resolved lazily, by the guards below, so public
// CDN-cached routes never touch the database. Admin routes read a fresh session
// (cookie cache bypassed) so bans and role changes apply on the next request.
async function resolve(c: Context<AppEnv>): Promise<Actor> {
  const { session, setCookies } = await getFreshSession(c.req.raw.headers);
  const actor = session ? toActor(session) : null;
  c.set('actor', actor);
  // Forward a refreshed session cookie, unless the handler set that cookie itself.
  for (const cookie of setCookies) c.header('Set-Cookie', cookie, { append: true });
  if (!actor) throw ApiError.unauthorized('Sign in to continue');
  // A site customer (role `user`) has a valid session but no admin access.
  if (!isAdminRole(actor.roles)) throw ApiError.forbidden("You don't have permission to do that");
  return actor;
}

// Any signed-in admin-role user.
export const signedIn = createMiddleware<AppEnv>(async (c, next) => {
  await resolve(c);
  await next();
});

// Signed in AND granted every listed permission by at least one of their roles.
export const can = (permissions: Permissions) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const actor = await resolve(c);
    if (!hasPermission(actor.roles, permissions)) throw ApiError.forbidden("You don't have permission to do that");
    await next();
  });

// Signed in AND granted at least one of the listed permission sets.
export const canAny = (...options: Permissions[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const actor = await resolve(c);
    if (!options.some((permissions) => hasPermission(actor.roles, permissions))) {
      throw ApiError.forbidden("You don't have permission to do that");
    }
    await next();
  });

// The actor set by a preceding guard.
export function actorOf(c: Context<AppEnv>): Actor {
  const actor = c.get('actor');
  if (!actor) throw ApiError.unauthorized('Sign in to continue');
  return actor;
}
