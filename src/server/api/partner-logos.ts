import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { auditRoute } from '@/server/middleware/audit-route';
import { can } from '@/server/middleware/auth';
import { notViewingAs } from '@/server/middleware/view-as';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import {
  createPartnerLogoSchema,
  partnerLogoListQuerySchema,
  reorderPartnerLogosSchema,
  updatePartnerLogoSchema,
} from '@/validations/partner-logo-schema';

const READ_ONLY_VIEW_AS = 'View-as is read-only: settings cannot be changed';

const idParamSchema = z.object({ id: z.string().uuid() });

export const partnerLogos = new Hono<AppEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await partnerLogoService.listEnabled();
    return ok(c, data);
  })

  .get('/admin/list', can({ content: ['read'] }), zValidator('query', partnerLogoListQuerySchema), async (c) => {
    const { page, limit } = c.req.valid('query');
    const { rows, total } = await partnerLogoService.listAdmin({ page, limit });
    return ok(c, rows, { pagination: buildPagination(total, page, limit) });
  })

  .get('/:id', can({ content: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await partnerLogoService.byId(id);
    if (!row) throw ApiError.notFound('Partner logo not found');
    return ok(c, row);
  })

  .post(
    '/',
    can({ content: ['create'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({ action: 'partner_logo.create', entityType: 'partner_logo', summary: 'Partner logo created' }),
    zValidator('json', createPartnerLogoSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await partnerLogoService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    can({ content: ['update'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({ action: 'partner_logo.reorder', entityType: 'partner_logo', summary: 'Partner logos reordered' }),
    zValidator('json', reorderPartnerLogosSchema),
    async (c) => {
      const input = c.req.valid('json');
      await partnerLogoService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    can({ content: ['update'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({
      action: 'partner_logo.update',
      entityType: 'partner_logo',
      summary: 'Partner logo updated',
      load: partnerLogoService.byId,
    }),
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
    can({ content: ['delete'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({ action: 'partner_logo.delete', entityType: 'partner_logo', summary: 'Partner logo deleted' }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await partnerLogoService.remove(id);
      return ok(c, { success: true });
    },
  );
