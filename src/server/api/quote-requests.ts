import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import type { AppEnv } from '@/server/api/types';
import { auditRoute } from '@/server/middleware/audit-route';
import { can } from '@/server/middleware/auth';
import { notViewingAs } from '@/server/middleware/view-as';
import { uploadInquiryPhotos } from '@/server/lib/inquiry-photos';
import { quoteRequestService } from '@/server/services/quote-request-service';
import {
  createQuoteRequestSchema,
  publicQuoteRequestSchema,
  quoteRequestListQuerySchema,
  updateQuoteRequestSchema,
} from '@/validations/quote-request-schema';

const READ_ONLY_VIEW_AS = 'View-as is read-only: settings cannot be changed';

const idParamSchema = z.object({ id: z.string().uuid() });

export const quoteRequests = new Hono<AppEnv>()
  // Public submission endpoint for website visitors
  .post('/', rateLimit(30, 60_000), zValidator('json', publicQuoteRequestSchema), async (c) => {
    // Fill the admin-field defaults (status 'new', unassigned, unpaid) server-side.
    const input = createQuoteRequestSchema.parse(c.req.valid('json'));
    input.photoUrls = await uploadInquiryPhotos(input.photoUrls, 'vantage/quotes');
    const row = await quoteRequestService.create(input);
    return ok(c, row, { status: 201 });
  })

  // Staff-entered enquiry (phone / walk-in): full admin schema.
  .post(
    '/admin',
    can({ quote: ['update'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({ action: 'quote.create', entityType: 'quote', summary: 'Quote request created' }),
    zValidator('json', createQuoteRequestSchema),
    async (c) => {
      const row = await quoteRequestService.create(c.req.valid('json'), { notify: false });
      return ok(c, row, { status: 201 });
    },
  )

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
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({
      action: 'quote.update',
      entityType: 'quote',
      summary: 'Quote request updated',
      load: quoteRequestService.byId,
      fields: [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'eircode',
        'registration',
        'description',
        'status',
        'assignedUserId',
        'inspectionDate',
        'estimatedCost',
        'paymentStatus',
        'paidAmount',
        'paymentMethod',
        'invoiceNumber',
        'completedAt',
        'adminNotes',
      ],
      redact: ['adminNotes', 'name', 'email', 'phone', 'address', 'city', 'eircode', 'registration', 'description'],
    }),
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
    can({ quote: ['delete'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    auditRoute({ action: 'quote.delete', entityType: 'quote', summary: 'Quote request deleted' }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await quoteRequestService.remove(id);
      return ok(c, { success: true });
    },
  );
