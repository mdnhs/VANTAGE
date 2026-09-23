import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { projectService } from '@/server/services/project-service';
import {
  createProjectSchema,
  projectListQuerySchema,
  projectStatusSchema,
  reorderProjectsSchema,
  updateProjectSchema,
} from '@/validations/project-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const projects = new Hono<AuthEnv>()
  // Public read — unused by the marketing frontend today (it reads projectService
  // directly), kept for external API consumers.
  .get('/', async (c) => {
    const data = await projectService.listPublished();
    return ok(c, data);
  })

  .get('/featured', async (c) => {
    const data = await projectService.listFeatured();
    return ok(c, data);
  })

  .get(
    '/admin/list',
    requireAuth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    zValidator('query', projectListQuerySchema),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const { rows, total } = await projectService.listAdmin({ page, limit });
      return ok(c, rows, { pagination: buildPagination(total, page, limit) });
    },
  )

  .get(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const row = await projectService.byId(id);
      if (!row) throw ApiError.notFound('Project not found');
      return ok(c, row);
    },
  )

  .post(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    zValidator('json', createProjectSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await projectService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    requireAuth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    zValidator('json', reorderProjectsSchema),
    async (c) => {
      const input = c.req.valid('json');
      await projectService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id/status',
    requireAuth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
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
    requireAuth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
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
    requireAuth,
    requirePermission(PERMISSIONS.PROJECTS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await projectService.remove(id);
      return ok(c, { success: true });
    },
  );
