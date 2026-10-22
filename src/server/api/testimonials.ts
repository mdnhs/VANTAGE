import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { can } from '@/server/middleware/auth';
import { testimonialService } from '@/server/services/testimonial-service';
import {
  createTestimonialSchema,
  reorderTestimonialsSchema,
  testimonialListQuerySchema,
  testimonialStatusSchema,
  updateTestimonialSchema,
} from '@/validations/testimonial-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const testimonials = new Hono<AppEnv>()
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

  .get('/admin/list', can({ content: ['read'] }), zValidator('query', testimonialListQuerySchema), async (c) => {
    const { page, limit } = c.req.valid('query');
    const { rows, total } = await testimonialService.listAdmin({ page, limit });
    return ok(c, rows, { pagination: buildPagination(total, page, limit) });
  })

  .get('/:id', can({ content: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await testimonialService.byId(id);
    if (!row) throw ApiError.notFound('Testimonial not found');
    return ok(c, row);
  })

  .post('/', can({ content: ['create'] }), zValidator('json', createTestimonialSchema), async (c) => {
    const input = c.req.valid('json');
    const row = await testimonialService.create(input);
    return ok(c, row, { status: 201 });
  })

  .patch('/reorder', can({ content: ['update'] }), zValidator('json', reorderTestimonialsSchema), async (c) => {
    const input = c.req.valid('json');
    await testimonialService.reorder(input);
    return ok(c, { success: true });
  })

  .patch(
    '/:id/status',
    can({ content: ['update'] }),
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
    can({ content: ['update'] }),
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

  .delete('/:id', can({ content: ['delete'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    await testimonialService.remove(id);
    return ok(c, { success: true });
  });
