import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import {
  createHomepageProcessStepSchema,
  homepageProcessStepListQuerySchema,
  reorderHomepageProcessStepsSchema,
  updateHomepageProcessStepSchema,
} from '@/validations/homepage-process-step-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const homepageProcessSteps = new Hono<AuthEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await homepageProcessStepService.listEnabled();
    return ok(c, data);
  })

  .get(
    '/admin/list',
    requireAuth,
    requirePermission(PERMISSIONS.PROCESS_MANAGE),
    zValidator('query', homepageProcessStepListQuerySchema),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const { rows, total } = await homepageProcessStepService.listAdmin({ page, limit });
      return ok(c, rows, { pagination: buildPagination(total, page, limit) });
    },
  )

  .get(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.PROCESS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const row = await homepageProcessStepService.byId(id);
      if (!row) throw ApiError.notFound('Homepage process step not found');
      return ok(c, row);
    },
  )

  .post(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.PROCESS_MANAGE),
    zValidator('json', createHomepageProcessStepSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await homepageProcessStepService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    requireAuth,
    requirePermission(PERMISSIONS.PROCESS_MANAGE),
    zValidator('json', reorderHomepageProcessStepsSchema),
    async (c) => {
      const input = c.req.valid('json');
      await homepageProcessStepService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.PROCESS_MANAGE),
    zValidator('param', idParamSchema),
    zValidator('json', updateHomepageProcessStepSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await homepageProcessStepService.update(id, input);
      if (!row) throw ApiError.notFound('Homepage process step not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.PROCESS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await homepageProcessStepService.remove(id);
      return ok(c, { success: true });
    },
  );
