import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import type { AppEnv } from '@/server/api/types';
import { can } from '@/server/middleware/auth';
import { uploadInquiryPhotos } from '@/server/lib/inquiry-photos';
import { quoteRequestService } from '@/server/services/quote-request-service';
import {
  createQuoteRequestSchema,
  quoteRequestListQuerySchema,
  updateQuoteRequestSchema,
} from '@/validations/quote-request-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const quoteRequests = new Hono<AppEnv>()
  // Public submission endpoint for website visitors
  .post('/', rateLimit(30, 60_000), zValidator('json', createQuoteRequestSchema), async (c) => {
    const input = c.req.valid('json');
    input.photoUrls = await uploadInquiryPhotos(input.photoUrls, 'vantage/quotes');
    const row = await quoteRequestService.create(input);
    return ok(c, row, { status: 201 });
  })

  // Admin list with pagination, search, and status filtering
  .get('/admin/list', can({ quote: ['read'] }), zValidator('query', quoteRequestListQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const { rows, total } = await quoteRequestService.list(query);
    return ok(c, rows, { pagination: buildPagination(total, query.page, query.limit) });
  })

  // Status count stats for dashboard badges/tabs
  .get('/admin/stats', can({ quote: ['read'] }), async (c) => {
    const stats = await quoteRequestService.stats();
    return ok(c, stats);
  })

  // Get specific quote request details
  .get('/:id', can({ quote: ['read'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const row = await quoteRequestService.byId(id);
    if (!row) throw ApiError.notFound('Quote request not found');
    return ok(c, row);
  })

  // Update status, notes, or estimated cost
  .patch(
    '/:id',
    can({ quote: ['update'] }),
    zValidator('param', idParamSchema),
    zValidator('json', updateQuoteRequestSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const row = await quoteRequestService.update(id, input);
      if (!row) throw ApiError.notFound('Quote request not found');
      return ok(c, row);
    },
  )

  // Delete quote request
  .delete('/:id', can({ quote: ['delete'] }), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    await quoteRequestService.remove(id);
    return ok(c, { success: true });
  });
