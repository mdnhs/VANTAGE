import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { testimonialService } from '@/server/services/testimonial-service';
import {
  createTestimonialSchema,
  reorderTestimonialsSchema,
  testimonialListQuerySchema,
  testimonialStatusSchema,
  updateTestimonialSchema,
} from '@/validations/testimonial-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const testimonials = new Hono<AuthEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    const data = await testimonialService.listPublished();
    return ok(c, data);
  })

  .get('/featured', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    const data = await testimonialService.listFeatured();
    return ok(c, data);
  })

  .get(
    '/admin/list',
    requireAuth,
    requirePermission(PERMISSIONS.TESTIMONIALS_MANAGE),
    zValidator('query', testimonialListQuerySchema),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const { rows, total } = await testimonialService.listAdmin({ page, limit });
      return ok(c, rows, { pagination: buildPagination(total, page, limit) });
    },
  )

  .get(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.TESTIMONIALS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const row = await testimonialService.byId(id);
      if (!row) throw ApiError.notFound('Testimonial not found');
      return ok(c, row);
    },
  )

  .post(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.TESTIMONIALS_MANAGE),
    zValidator('json', createTestimonialSchema),
    async (c) => {
      const input = c.req.valid('json');
      const row = await testimonialService.create(input);
      return ok(c, row, { status: 201 });
    },
  )

  .patch(
    '/reorder',
    requireAuth,
    requirePermission(PERMISSIONS.TESTIMONIALS_MANAGE),
    zValidator('json', reorderTestimonialsSchema),
    async (c) => {
      const input = c.req.valid('json');
      await testimonialService.reorder(input);
      return ok(c, { success: true });
    },
  )

  .patch(
    '/:id/status',
    requireAuth,
    requirePermission(PERMISSIONS.TESTIMONIALS_MANAGE),
    zValidator('param', idParamSchema),
    zValidator('json', testimonialStatusSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await testimonialService.updateStatus(id, input);
      if (!row) throw ApiError.notFound('Testimonial not found');
      return ok(c, row);
    },
  )

  .patch(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.TESTIMONIALS_MANAGE),
    zValidator('param', idParamSchema),
    zValidator('json', updateTestimonialSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await testimonialService.update(id, input);
      if (!row) throw ApiError.notFound('Testimonial not found');
      return ok(c, row);
    },
  )

  .delete(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.TESTIMONIALS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await testimonialService.remove(id);
      return ok(c, { success: true });
    },
  );
