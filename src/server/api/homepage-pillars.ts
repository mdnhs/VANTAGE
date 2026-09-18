import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { homepagePillarService } from '@/server/services/homepage-pillar-service';
import {
  createHomepagePillarSchema,
  homepagePillarListQuerySchema,
  reorderHomepagePillarsSchema,
  updateHomepagePillarSchema,
} from '@/validations/homepage-pillar-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const homepagePillars = new Hono<AuthEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await homepagePillarService.listEnabled();
    return ok(c, data);
  })

  .get(
    '/admin/list',
    requireAuth,
    requirePermission(PERMISSIONS.PILLARS_MANAGE),
    zValidator('query', homepagePillarListQuerySchema),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const { rows, total } = await homepagePillarService.listAdmin({ page, limit });
      return ok(c, rows, { pagination: buildPagination(total, page, limit) });
    },
  )

  .get(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.PILLARS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const row = await homepagePillarService.byId(id);
      if (!row) throw ApiError.notFound('Homepage pillar not found');
      return ok(c, row);
    },
  )

  .post(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.PILLARS_MANAGE),
    zValidator('json', createHomepagePillarSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await homepagePillarService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    requireAuth,
    requirePermission(PERMISSIONS.PILLARS_MANAGE),
    zValidator('json', reorderHomepagePillarsSchema),
    async (c) => {
      const input = c.req.valid('json');
      await homepagePillarService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.PILLARS_MANAGE),
    zValidator('param', idParamSchema),
    zValidator('json', updateHomepagePillarSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await homepagePillarService.update(id, input);
      if (!row) throw ApiError.notFound('Homepage pillar not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.PILLARS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await homepagePillarService.remove(id);
      return ok(c, { success: true });
    },
  );
