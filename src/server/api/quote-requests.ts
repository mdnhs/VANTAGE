import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { uploadInquiryPhotos } from '@/server/lib/inquiry-photos';
import { quoteRequestService } from '@/server/services/quote-request-service';
import {
  createQuoteRequestSchema,
  quoteRequestListQuerySchema,
  updateQuoteRequestSchema,
} from '@/validations/quote-request-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const quoteRequests = new Hono<AuthEnv>()
  // Public submission endpoint for website visitors
  .post('/', rateLimit(30, 60_000), zValidator('json', createQuoteRequestSchema), async (c) => {
    const input = c.req.valid('json');
    input.photoUrls = await uploadInquiryPhotos(input.photoUrls, 'vantage/quotes');
    const row = await quoteRequestService.create(input);
    return ok(c, row, { status: 201 });
  })

  // Admin list with pagination, search, and status filtering
  .get(
    '/admin/list',
    requireAuth,
    requirePermission(PERMISSIONS.QUOTES_MANAGE),
    zValidator('query', quoteRequestListQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const { rows, total } = await quoteRequestService.list(query);
      return ok(c, rows, { pagination: buildPagination(total, query.page, query.limit) });
    },
  )

  // Status count stats for dashboard badges/tabs
  .get('/admin/stats', requireAuth, requirePermission(PERMISSIONS.QUOTES_MANAGE), async (c) => {
    const stats = await quoteRequestService.stats();
    return ok(c, stats);
  })

  // Get specific quote request details
  .get(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.QUOTES_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const row = await quoteRequestService.byId(id);
      if (!row) throw ApiError.notFound('Quote request not found');
      return ok(c, row);
    },
  )

  // Update status, notes, or estimated cost
  .patch(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.QUOTES_MANAGE),
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
  .delete(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.QUOTES_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await quoteRequestService.remove(id);
      return ok(c, { success: true });
    },
  );
