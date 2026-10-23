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
import { homepagePillarService } from '@/server/services/homepage-pillar-service';
import {
  createHomepagePillarSchema,
  homepagePillarListQuerySchema,
  reorderHomepagePillarsSchema,
  updateHomepagePillarSchema,
} from '@/validations/homepage-pillar-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const homepagePillars = new Hono<AppEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await homepagePillarService.listEnabled();
    return ok(c, data);
  })

  .get('/admin/list', can({ content: ['read'] }), zValidator('query', homepagePillarListQuerySchema), async (c) => {
    const { page, limit } = c.req.valid('query');
    const { rows, total } = await homepagePillarService.listAdmin({ page, limit });
    return ok(c, rows, { pagination: buildPagination(total, page, limit) });
  })

  .get('/:id', can({ content: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await homepagePillarService.byId(id);
    if (!row) throw ApiError.notFound('Homepage pillar not found');
    return ok(c, row);
  })

  .post(
    '/',
    can({ content: ['create'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({ action: 'homepage_pillar.create', entityType: 'homepage_pillar', summary: 'Homepage pillar created' }),
    zValidator('json', createHomepagePillarSchema),
    async (c) => {
      const input = c.req.valid('json');
      assertContentWrite(actorOf(c), { type: 'pillar', action: 'create' });
      const row = await homepagePillarService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    can({ content: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_pillar.reorder',
      entityType: 'homepage_pillar',
      summary: 'Homepage pillars reordered',
    }),
    zValidator('json', reorderHomepagePillarsSchema),
    async (c) => {
      const input = c.req.valid('json');
      assertContentWrite(actorOf(c), { type: 'pillar', action: 'reorder' });
      await homepagePillarService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id',
    can({ content: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_pillar.update',
      entityType: 'homepage_pillar',
      summary: 'Homepage pillar updated',
      load: homepagePillarService.byId,
    }),
    zValidator('param', idParamSchema),
    zValidator('json', updateHomepagePillarSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      assertContentWrite(actorOf(c), { type: 'pillar', action: 'update' });
      const row = await homepagePillarService.update(id, input);
      if (!row) throw ApiError.notFound('Homepage pillar not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    can({ content: ['delete'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'homepage_pillar.delete',
      entityType: 'homepage_pillar',
      summary: 'Homepage pillar deleted',
      load: homepagePillarService.byId,
    }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await homepagePillarService.remove(id);
      return ok(c, { success: true });
    },
  );
