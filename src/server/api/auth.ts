import bcrypt from 'bcryptjs';
import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import { ok } from '@/server/lib/response';
import { ApiError } from '@/server/lib/errors';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import { requireAuth, type AuthEnv } from '@/server/middleware/auth';
import { adminUserRepository } from '@/server/repositories/admin-user-repository';
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/server/lib/session';
import { decompressPermissions } from '@/lib/permission/utils';
import { PERMISSIONS, type PermissionValue } from '@/lib/permission/permissions';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Keep this path DB-free except for the two required lookups on login — everything else
// (requireAuth on every other route) resolves purely from the signed cookie.
export const auth = new Hono<AuthEnv>()
  .post('/login', rateLimit(10, 60_000), zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    const user = await adminUserRepository.byEmail(email);
    if (!user || !user.isActive) throw ApiError.unauthorized('Invalid email or password');

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) throw ApiError.unauthorized('Invalid email or password');

    const decompressed = decompressPermissions(user.permissionsBitfield);
    const permissions =
      user.role === 'admin' || decompressed.includes(PERMISSIONS.ADMINS_MANAGE)
        ? (Object.values(PERMISSIONS) as PermissionValue[])
        : decompressed;

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      permissions,
    });

    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });

    await adminUserRepository.touchLastLogin(user.id);

    return ok(c, { id: user.id, email: user.email, name: user.name });
  })

  .post('/logout', async (c) => {
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    return ok(c, null);
  })

  .get('/me', requireAuth, async (c) => ok(c, c.get('user')));
