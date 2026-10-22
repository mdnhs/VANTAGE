import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import type { AppEnv } from '@/server/api/types';
import { auditRoute } from '@/server/middleware/audit-route';
import { can } from '@/server/middleware/auth';
import { notViewingAs, VIEW_AS_READ_ONLY } from '@/server/middleware/view-as';
import { contactMessageService } from '@/server/services/contact-message-service';
import { classifySubmission } from '@/server/lib/enquiries/classify';
import { storeEnquiryPhotos } from '@/server/lib/media/enquiry-photos';
import { clientIp, queueLeadConversionAfterResponse } from '@/server/services/lead-conversion';
import {
  publicContactMessageSchema,
  contactMessageListQuerySchema,
  updateContactMessageSchema,
} from '@/validations/contact-message-schema';

// 4 photos of up to 20 MB as base64 data URLs, plus the form fields.
const PUBLIC_BODY_LIMIT = bodyLimit({
  maxSize: 110 * 1024 * 1024,
  onError: () => {
    throw ApiError.payloadTooLarge('Photos are too large');
  },
});

const idParamSchema = z.object({ id: z.string().uuid() });

export const contacts = new Hono<AppEnv>()
  // Public submission endpoint for website visitors
  .post('/', rateLimit(30, 60_000), PUBLIC_BODY_LIMIT, zValidator('json', publicContactMessageSchema), async (c) => {
    const { eventId, sourcePath, website, stamp, ...input } = c.req.valid('json');

    // A bot gets the same 201 as a visitor, but its row is filed as spam: no photos stored,
    // no email, no lead conversion.
    const spamReason = classifySubmission({ website, stamp }) ?? undefined;
    const photoMediaIds = spamReason ? [] : await storeEnquiryPhotos(input.photoUrls);

    const row = await contactMessageService.create(input, { photoMediaIds, spamReason });
    if (!row) throw new Error('The contact message was not saved');
    if (!spamReason)
      queueLeadConversionAfterResponse({
        leadId: row.id,
        eventId,
        sourcePath,
        email: row.email,
        phone: row.phone,
        cookieHeader: c.req.header('cookie'),
        ip: clientIp(c.req.raw.headers),
        userAgent: c.req.header('user-agent') ?? '',
      });
    // Visitors never get the stored photo URLs back.
    const { photos: _photos, ...echo } = row;
    return ok(c, echo, { status: 201 });
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
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'contact.update',
      entityType: 'contact',
      summary: 'Contact message updated',
      load: contactMessageService.byId,
      fields: ['status', 'adminNotes', 'spamReason'],
      redact: ['adminNotes'],
    }),
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
  .delete(
    '/:id',
    can({ contact: ['delete'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'contact.delete',
      entityType: 'contact',
      summary: 'Contact message deleted',
      load: contactMessageService.byId,
    }),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await contactMessageService.remove(id);
      return ok(c, { success: true });
    },
  );
