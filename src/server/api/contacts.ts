import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { contactMessageService } from '@/server/services/contact-message-service';
import { cloudinary } from '@/lib/cloudinary/server';
import {
  createContactMessageSchema,
  contactMessageListQuerySchema,
  updateContactMessageSchema,
} from '@/validations/contact-message-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

export const contacts = new Hono<AuthEnv>()
  // Public submission endpoint for website visitors
  .post('/', rateLimit(30, 60_000), zValidator('json', createContactMessageSchema), async (c) => {
    const input = c.req.valid('json');

    if (input.photoUrls && input.photoUrls.length > 0) {
      const processedUrls: string[] = [];
      for (const item of input.photoUrls) {
        if (item.startsWith('data:image/')) {
          try {
            const res = await cloudinary.uploader.upload(item, {
              folder: 'vantage/inquiries',
              resource_type: 'image',
            });
            processedUrls.push(res.secure_url);
          } catch {
            // Ignore failed individual image upload
          }
        } else {
          processedUrls.push(item);
        }
      }
      input.photoUrls = processedUrls;
    }

    const row = await contactMessageService.create(input);
    return ok(c, row, { status: 201 });
  })

  // Admin list with pagination, search, and status filtering
  .get(
    '/admin/list',
    requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_MANAGE),
    zValidator('query', contactMessageListQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const { rows, total } = await contactMessageService.list(query);
      return ok(c, rows, { pagination: buildPagination(total, query.page, query.limit) });
    },
  )

  // Status count stats for dashboard badges/tabs
  .get('/admin/stats', requireAuth, requirePermission(PERMISSIONS.CONTACTS_MANAGE), async (c) => {
    const stats = await contactMessageService.stats();
    return ok(c, stats);
  })

  // Get specific contact message details
  .get(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const row = await contactMessageService.byId(id);
      if (!row) throw ApiError.notFound('Contact inquiry not found');
      return ok(c, row);
    },
  )

  // Update status or notes
  .patch(
    '/:id',
    requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_MANAGE),
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
    requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_MANAGE),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await contactMessageService.remove(id);
      return ok(c, { success: true });
    },
  );
