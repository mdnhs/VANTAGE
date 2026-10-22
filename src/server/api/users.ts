import { Hono } from 'hono';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { can } from '@/server/middleware/auth';
import { userService } from '@/server/services/user-service';
import { createUserSchema } from '@/validations/user-schema';

// Site-user accounts (Better Auth) are admin-provisioned only — no public sign-up route
// exists, so every route here requires an admin role with user[list|create].
export const users = new Hono<AppEnv>()
  .get('/', can({ user: ['list'] }), async (c) => {
    const rows = await userService.list();
    return ok(c, rows);
  })

  .post('/', can({ user: ['create'] }), zValidator('json', createUserSchema), async (c) => {
    const input = c.req.valid('json');
    const row = await userService.create(input);
    return ok(c, row, { status: 201 });
  });
