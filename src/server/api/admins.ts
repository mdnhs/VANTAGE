import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { actorOf, can } from '@/server/middleware/auth';
import { adminUserService } from '@/server/services/admin-user-service';
import { changePasswordSchema, createAdminUserSchema, updateAdminUserSchema } from '@/validations/admin-user-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

// Admin-user management is entirely admin-only — no public routes at all, every route
// requires both a session and ADMINS_MANAGE.
export const admins = new Hono<AppEnv>()
  .get('/', can({ user: ['list'] }), async (c) => {
    const rows = await adminUserService.list();
    return ok(c, rows);
  })

  .get('/:id', can({ user: ['get'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await adminUserService.byId(id);
    if (!row) throw ApiError.notFound('Admin user not found');
    return ok(c, row);
  })

  .post('/', can({ user: ['create'] }), zValidator('json', createAdminUserSchema), async (c) => {
    const input = c.req.valid('json');
    const row = await adminUserService.create(input);
    return ok(c, row, { status: 201 });
  })

  .patch(
    '/:id',
    can({ user: ['update'] }),
    zValidator('param', idParamSchema),
    zValidator('json', updateAdminUserSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const currentUserId = actorOf(c).userId;
      const row = await adminUserService.update(currentUserId, id, input);
      return ok(c, row);
    },
  )

  .patch(
    '/:id/password',
    can({ user: ['set-password'] }),
    zValidator('param', idParamSchema),
    zValidator('json', changePasswordSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const { password } = c.req.valid('json');
      await adminUserService.resetPassword(id, password);
      return ok(c, { success: true });
    },
  );
