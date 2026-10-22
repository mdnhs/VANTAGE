import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { auditRoute } from '@/server/middleware/audit-route';
import { can } from '@/server/middleware/auth';
import { notViewingAs, VIEW_AS_READ_ONLY } from '@/server/middleware/view-as';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import {
  createHomepageProcessStepSchema,
  homepageProcessStepListQuerySchema,
  reorderHomepageProcessStepsSchema,
  updateHomepageProcessStepSchema,
} from '@/validations/homepage-process-step-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const homepageProcessSteps = new Hono<AppEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await homepageProcessStepService.listEnabled();
    return ok(c, data);
  })

  .get(
    '/admin/list',
    can({ content: ['read'] }),
    zValidator('query', homepageProcessStepListQuerySchema),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const { rows, total } = await homepageProcessStepService.listAdmin({ page, limit });
      return ok(c, rows, { pagination: buildPagination(total, page, limit) });
    },
  )

  .get('/:id', can({ content: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await homepageProcessStepService.byId(id);
    if (!row) throw ApiError.notFound('Homepage process step not found');
    return ok(c, row);
  })

  .post(
    '/',
    can({ content: ['create'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_process_step.create',
      entityType: 'homepage_process_step',
      summary: 'Homepage process step created',
    }),
    zValidator('json', createHomepageProcessStepSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await homepageProcessStepService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    can({ content: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_process_step.reorder',
      entityType: 'homepage_process_step',
      summary: 'Homepage process steps reordered',
    }),
    zValidator('json', reorderHomepageProcessStepsSchema),
    async (c) => {
      const input = c.req.valid('json');
      await homepageProcessStepService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    can({ content: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_process_step.update',
      entityType: 'homepage_process_step',
      summary: 'Homepage process step updated',
      load: homepageProcessStepService.byId,
    }),
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
    can({ content: ['delete'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_process_step.delete',
      entityType: 'homepage_process_step',
      summary: 'Homepage process step deleted',
    }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await homepageProcessStepService.remove(id);
      return ok(c, { success: true });
    },
  );
