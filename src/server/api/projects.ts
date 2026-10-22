import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { auditRoute } from '@/server/middleware/audit-route';
import { can } from '@/server/middleware/auth';
import { notViewingAs } from '@/server/middleware/view-as';
import { projectService } from '@/server/services/project-service';
import {
  createProjectSchema,
  projectListQuerySchema,
  projectStatusSchema,
  reorderProjectsSchema,
  updateProjectSchema,
} from '@/validations/project-schema';

const READ_ONLY_VIEW_AS = 'View-as is read-only: settings cannot be changed';

const idParamSchema = z.object({ id: z.string().uuid() });

export const projects = new Hono<AppEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    const data = await projectService.listPublished();
    return ok(c, data);
  })

  .get('/featured', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    const data = await projectService.listFeatured();
    return ok(c, data);
  })

  .get('/admin/list', can({ content: ['read'] }), zValidator('query', projectListQuerySchema), async (c) => {
    const { page, limit } = c.req.valid('query');
    const { rows, total } = await projectService.listAdmin({ page, limit });
    return ok(c, rows, { pagination: buildPagination(total, page, limit) });
  })

  .get('/:id', can({ content: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await projectService.byId(id);
    if (!row) throw ApiError.notFound('Project not found');
    return ok(c, row);
  })

  .post(
    '/',
    can({ content: ['create'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({ action: 'project.create', entityType: 'project', summary: 'Project created' }),
    zValidator('json', createProjectSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await projectService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    can({ content: ['update'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({ action: 'project.reorder', entityType: 'project', summary: 'Projects reordered' }),
    zValidator('json', reorderProjectsSchema),
    async (c) => {
      const input = c.req.valid('json');
      await projectService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id/status',
    can({ content: ['update'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({
      action: 'project.update',
      entityType: 'project',
      summary: 'Project updated',
      fields: ['status'],
      load: projectService.byId,
    }),
    zValidator('param', idParamSchema),
    zValidator('json', projectStatusSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await projectService.updateStatus(id, input);
      if (!row) throw ApiError.notFound('Project not found');
      return ok(c, row);
    },
  )

  .patch(
    '/:id',
    can({ content: ['update'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({
      action: 'project.update',
      entityType: 'project',
      summary: 'Project updated',
      load: projectService.byId,
    }),
    zValidator('param', idParamSchema),
    zValidator('json', updateProjectSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await projectService.update(id, input);
      if (!row) throw ApiError.notFound('Project not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    can({ content: ['delete'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({ action: 'project.delete', entityType: 'project', summary: 'Project deleted' }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await projectService.remove(id);
      return ok(c, { success: true });
    },
  );
