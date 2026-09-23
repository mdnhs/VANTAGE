import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import {
  createPartnerLogoSchema,
  partnerLogoListQuerySchema,
  reorderPartnerLogosSchema,
  updatePartnerLogoSchema,
} from '@/validations/partner-logo-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const partnerLogos = new Hono<AuthEnv>()
  // Public read — unused by the marketing frontend today (it reads partnerLogoService
  // directly), kept for external API consumers.
  .get('/', async (c) => {
    const data = await partnerLogoService.listEnabled();
    return ok(c, data);
  })

  .get(
    '/admin/list',
    requireAuth,
    requirePermission(PERMISSIONS.LOGOS_MANAGE),
    zValidator('query', partnerLogoListQuerySchema),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const { rows, total } = await partnerLogoService.listAdmin({ page, limit });
      return ok(c, rows, { pagination: buildPagination(total, page, limit) });
    },
  )

  .get(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.LOGOS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const row = await partnerLogoService.byId(id);
      if (!row) throw ApiError.notFound('Partner logo not found');
      return ok(c, row);
    },
  )

  .post(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.LOGOS_MANAGE),
    zValidator('json', createPartnerLogoSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await partnerLogoService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    requireAuth,
    requirePermission(PERMISSIONS.LOGOS_MANAGE),
    zValidator('json', reorderPartnerLogosSchema),
    async (c) => {
      const input = c.req.valid('json');
      await partnerLogoService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.LOGOS_MANAGE),
    zValidator('param', idParamSchema),
    zValidator('json', updatePartnerLogoSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await partnerLogoService.update(id, input);
      if (!row) throw ApiError.notFound('Partner logo not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.LOGOS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await partnerLogoService.remove(id);
      return ok(c, { success: true });
    },
  );
