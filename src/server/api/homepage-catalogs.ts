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
import { homepageCatalogService } from '@/server/services/homepage-catalog-service';
import {
  createHomepageCatalogSchema,
  homepageCatalogListQuerySchema,
  reorderHomepageCatalogsSchema,
  updateHomepageCatalogSchema,
} from '@/validations/homepage-catalog-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const homepageCatalogs = new Hono<AppEnv>()
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await homepageCatalogService.listEnabled();
    return ok(c, data);
  })

  .get('/admin/list', can({ content: ['read'] }), zValidator('query', homepageCatalogListQuerySchema), async (c) => {
    const { page, limit } = c.req.valid('query');
    const { rows, total } = await homepageCatalogService.listAdmin({ page, limit });
    return ok(c, rows, { pagination: buildPagination(total, page, limit) });
  })

  .get('/:id', can({ content: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await homepageCatalogService.byId(id);
    if (!row) throw ApiError.notFound('Homepage catalog item not found');
    return ok(c, row);
  })

  .post(
    '/',
    can({ content: ['create'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_catalog.create',
      entityType: 'homepage_catalog',
      summary: 'Homepage catalog created',
    }),
    zValidator('json', createHomepageCatalogSchema),
    async (c) => {
      const input = c.req.valid('json');
      assertContentWrite(actorOf(c), { type: 'catalog', action: 'create' });
      const row = await homepageCatalogService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    can({ content: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_catalog.reorder',
      entityType: 'homepage_catalog',
      summary: 'Homepage catalogs reordered',
    }),
    zValidator('json', reorderHomepageCatalogsSchema),
    async (c) => {
      const input = c.req.valid('json');
      assertContentWrite(actorOf(c), { type: 'catalog', action: 'reorder' });
      await homepageCatalogService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    can({ content: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_catalog.update',
      entityType: 'homepage_catalog',
      summary: 'Homepage catalog updated',
      load: homepageCatalogService.byId,
    }),
    zValidator('param', idParamSchema),
    zValidator('json', updateHomepageCatalogSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      assertContentWrite(actorOf(c), { type: 'catalog', action: 'update' });
      const row = await homepageCatalogService.update(id, input);
      if (!row) throw ApiError.notFound('Homepage catalog item not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    can({ content: ['delete'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_catalog.delete',
      entityType: 'homepage_catalog',
      summary: 'Homepage catalog deleted',
      load: homepageCatalogService.byId,
    }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await homepageCatalogService.remove(id);
      return ok(c, { success: true });
    },
  );
