import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { can } from '@/server/middleware/auth';
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

  .post('/', can({ content: ['create'] }), zValidator('json', createHomepageCatalogSchema), async (c) => {
    const input = c.req.valid('json');
    const row = await homepageCatalogService.create(input);
    return ok(c, row, { status: 201 });
  })

  .patch('/reorder', can({ content: ['update'] }), zValidator('json', reorderHomepageCatalogsSchema), async (c) => {
    const input = c.req.valid('json');
    await homepageCatalogService.reorder(input);
    return ok(c, { success: true });
  })

  .patch(
    '/:id',
    can({ content: ['update'] }),
    zValidator('param', idParamSchema),
    zValidator('json', updateHomepageCatalogSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await homepageCatalogService.update(id, input);
      if (!row) throw ApiError.notFound('Homepage catalog item not found');
      return ok(c, row);
    },
  )

  .delete('/:id', can({ content: ['delete'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    await homepageCatalogService.remove(id);
    return ok(c, { success: true });
  });
