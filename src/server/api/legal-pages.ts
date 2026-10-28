import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { auditRoute } from '@/server/middleware/audit-route';
import { actorOf, can } from '@/server/middleware/auth';
import { assertContentWrite } from '@/server/lib/auth/content-access';
import { notViewingAs, VIEW_AS_READ_ONLY } from '@/server/middleware/view-as';
import { legalPageService } from '@/server/services/legal-page-service';
import {
  createLegalPageSchema,
  legalPageListQuerySchema,
  reorderLegalPagesSchema,
  updateLegalPageSchema,
} from '@/validations/legal-page-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

// Admin only: the public pages and footer read the cached service directly.
export const legalPages = new Hono<AppEnv>()
  .get('/admin/list', can({ content: ['read'] }), zValidator('query', legalPageListQuerySchema), async (c) => {
    const { page, limit } = c.req.valid('query');
    const { rows, total } = await legalPageService.listAdmin({ page, limit });
    return ok(c, rows, { pagination: buildPagination(total, page, limit) });
  })

  .get('/:id', can({ content: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await legalPageService.byId(id);
    if (!row) throw ApiError.notFound('Legal page not found');
    return ok(c, row);
  })

  .post(
    '/',
    can({ content: ['create'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({ action: 'legal_page.create', entityType: 'legal_page', summary: 'Legal page created' }),
    zValidator('json', createLegalPageSchema),
    async (c) => {
      const input = c.req.valid('json');
      const actor = actorOf(c);
      assertContentWrite(actor, { type: 'legal-page', action: 'create' });
      const row = await legalPageService.create(actor, input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    can({ content: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({ action: 'legal_page.reorder', entityType: 'legal_page', summary: 'Legal pages reordered' }),
    zValidator('json', reorderLegalPagesSchema),
    async (c) => {
      const input = c.req.valid('json');
      assertContentWrite(actorOf(c), { type: 'legal-page', action: 'reorder' });
      await legalPageService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    can({ content: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'legal_page.update',
      entityType: 'legal_page',
      summary: 'Legal page updated',
      load: legalPageService.byId,
    }),
    zValidator('param', idParamSchema),
    zValidator('json', updateLegalPageSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const actor = actorOf(c);
      assertContentWrite(actor, { type: 'legal-page', action: 'update' });
      const row = await legalPageService.update(actor, id, input);
      if (!row) throw ApiError.notFound('Legal page not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    can({ content: ['delete'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'legal_page.delete',
      entityType: 'legal_page',
      summary: 'Legal page deleted',
      load: legalPageService.byId,
    }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await legalPageService.remove(id);
      return ok(c, { success: true });
    },
  );
