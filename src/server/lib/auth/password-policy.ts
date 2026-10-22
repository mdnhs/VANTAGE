import 'server-only';

import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';

import { parseRoles } from '@/lib/auth/permissions';

// Better Auth's global floor is 8 (the customer `user` role). Anyone holding an
// admin role needs 12 when they set a password (invite, reset, change).
export const ADMIN_MIN_PASSWORD_LENGTH = 12;

export const PASSWORD_POLICY_PATHS = new Set(['/reset-password', '/change-password']);

type Ctx = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

async function roleOfTarget(ctx: Ctx): Promise<string | null | undefined> {
  if (ctx.path === '/change-password') {
    const session = (await getSessionFromCtx(ctx, { disableCookieCache: true })) as {
      user: { role?: string | null };
    } | null;
    return session?.user.role;
  }
  // /reset-password: the token's verification row names the user.
  const body = (ctx.body ?? {}) as { token?: string };
  const query = (ctx.query ?? {}) as { token?: string };
  const token = body.token || query.token;
  if (!token) return undefined;
  const verification = await ctx.context.internalAdapter.findVerificationValue(`reset-password:${token}`);
  if (!verification || verification.expiresAt < new Date()) return undefined;
  const user = await ctx.context.internalAdapter.findUserById(verification.value);
  return (user as { role?: string | null } | null)?.role;
}

// Unknown or invalid tokens / sessions fall through: Better Auth refuses them itself.
export async function enforceAdminPasswordLength(ctx: Ctx) {
  if (!PASSWORD_POLICY_PATHS.has(ctx.path)) return;
  const newPassword = (ctx.body as { newPassword?: unknown } | undefined)?.newPassword;
  if (typeof newPassword !== 'string') return;
  if (newPassword.length >= ADMIN_MIN_PASSWORD_LENGTH) return;
  const role = await roleOfTarget(ctx);
  if (parseRoles(role).length === 0) return;
  throw new APIError('BAD_REQUEST', {
    code: 'PASSWORD_TOO_SHORT',
    message: `Admin passwords need at least ${ADMIN_MIN_PASSWORD_LENGTH} characters`,
  });
}
