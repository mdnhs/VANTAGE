import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { auditRoute } from '@/server/middleware/audit-route';
import { can } from '@/server/middleware/auth';
import { serviceService } from '@/server/services/service-service';
import {
  createServiceSchema,
  reorderServicesSchema,
  serviceListQuerySchema,
  updateServiceSchema,
} from '@/validations/service-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const services = new Hono<AppEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await serviceService.listPublished();
    return ok(c, data);
  })

  .get('/admin/list', can({ content: ['read'] }), zValidator('query', serviceListQuerySchema), async (c) => {
    const { page, limit } = c.req.valid('query');
    const { rows, total } = await serviceService.listAdmin({ page, limit });
    return ok(c, rows, { pagination: buildPagination(total, page, limit) });
  })

  .get('/:id', can({ content: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await serviceService.byId(id);
    if (!row) throw ApiError.notFound('Service not found');
    return ok(c, row);
  })

  .post(
    '/',
    can({ content: ['create'] }),
    auditRoute({ action: 'service.create', entityType: 'service', summary: 'Service created' }),
    zValidator('json', createServiceSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await serviceService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    can({ content: ['update'] }),
    auditRoute({ action: 'service.reorder', entityType: 'service', summary: 'Services reordered' }),
    zValidator('json', reorderServicesSchema),
    async (c) => {
      const input = c.req.valid('json');
      await serviceService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    can({ content: ['update'] }),
    auditRoute({
      action: 'service.update',
      entityType: 'service',
      summary: 'Service updated',
      load: serviceService.byId,
    }),
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
    can({ content: ['delete'] }),
    auditRoute({ action: 'service.delete', entityType: 'service', summary: 'Service deleted' }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await serviceService.remove(id);
      return ok(c, { success: true });
    },
  );
