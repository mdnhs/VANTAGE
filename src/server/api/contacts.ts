import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import type { AppEnv } from '@/server/api/types';
import { can } from '@/server/middleware/auth';
import { contactMessageService } from '@/server/services/contact-message-service';
import { uploadInquiryPhotos } from '@/server/lib/inquiry-photos';
import {
  createContactMessageSchema,
  contactMessageListQuerySchema,
  updateContactMessageSchema,
} from '@/validations/contact-message-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const contacts = new Hono<AppEnv>()
  // Public submission endpoint for website visitors
  .post('/', rateLimit(30, 60_000), zValidator('json', createContactMessageSchema), async (c) => {
    const input = c.req.valid('json');

    input.photoUrls = await uploadInquiryPhotos(input.photoUrls, 'vantage/inquiries');

    const row = await contactMessageService.create(input);
    return ok(c, row, { status: 201 });
  })

  // Admin list with pagination, search, and status filtering
  .get('/admin/list', can({ contact: ['read'] }), zValidator('query', contactMessageListQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const { rows, total } = await contactMessageService.list(query);
    return ok(c, rows, { pagination: buildPagination(total, query.page, query.limit) });
  })

  // Status count stats for dashboard badges/tabs
  .get('/admin/stats', can({ contact: ['read'] }), async (c) => {
    const stats = await contactMessageService.stats();
    return ok(c, stats);
  })

  // Get specific contact message details
  .get('/:id', can({ contact: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await contactMessageService.byId(id);
    if (!row) throw ApiError.notFound('Contact inquiry not found');
    return ok(c, row);
  })

  // Update status or notes
  .patch(
    '/:id',
    can({ contact: ['update'] }),
    zValidator('param', idParamSchema),
    zValidator('json', updateContactMessageSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await contactMessageService.update(id, input);
      if (!row) throw ApiError.notFound('Contact inquiry not found');
      return ok(c, row);
    },
  )

  // Delete contact message
  .delete('/:id', can({ contact: ['delete'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    await contactMessageService.remove(id);
    return ok(c, { success: true });
  });
