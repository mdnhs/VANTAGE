import { Hono } from 'hono';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { userService } from '@/server/services/user-service';
import { createUserSchema } from '@/validations/user-schema';

// Site-user accounts (Better Auth) are admin-provisioned only — no public sign-up route
// exists, so every route here requires an authenticated admin with USERS_MANAGE.
export const users = new Hono<AuthEnv>()
  .use('*', requireAuth, requirePermission(PERMISSIONS.USERS_MANAGE))

  .get('/', async (c) => {
    const rows = await userService.list();
    return ok(c, rows);
  })

  .post('/', zValidator('json', createUserSchema), async (c) => {
    const input = c.req.valid('json');
    const row = await userService.create(input);
    return ok(c, row, { status: 201 });
  });
