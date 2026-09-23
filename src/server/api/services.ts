import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { serviceService } from '@/server/services/service-service';
import {
  createServiceSchema,
  reorderServicesSchema,
  serviceListQuerySchema,
  updateServiceSchema,
} from '@/validations/service-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const services = new Hono<AuthEnv>()
  // Public read — unused by the marketing frontend today (it reads serviceService
  // directly), kept for external API consumers.
  .get('/', async (c) => {
    const data = await serviceService.listPublished();
    return ok(c, data);
  })

  .get(
    '/admin/list',
    requireAuth,
    requirePermission(PERMISSIONS.SERVICES_MANAGE),
    zValidator('query', serviceListQuerySchema),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const { rows, total } = await serviceService.listAdmin({ page, limit });
      return ok(c, rows, { pagination: buildPagination(total, page, limit) });
    },
  )

  .get(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.SERVICES_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const row = await serviceService.byId(id);
      if (!row) throw ApiError.notFound('Service not found');
      return ok(c, row);
    },
  )

  .post(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.SERVICES_MANAGE),
    zValidator('json', createServiceSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await serviceService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    requireAuth,
    requirePermission(PERMISSIONS.SERVICES_MANAGE),
    zValidator('json', reorderServicesSchema),
    async (c) => {
      const input = c.req.valid('json');
      await serviceService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.SERVICES_MANAGE),
    zValidator('param', idParamSchema),
    zValidator('json', updateServiceSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await serviceService.update(id, input);
      if (!row) throw ApiError.notFound('Service not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.SERVICES_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await serviceService.remove(id);
      return ok(c, { success: true });
    },
  );
