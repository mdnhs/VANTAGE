import { Hono, type Context } from 'hono';
import { ERROR_CODES, ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, type AuthEnv } from '@/server/middleware/auth';
import { rateLimit } from '@/server/middleware/rate-limit';
import { mediaLibraryService } from '@/server/services/media-library-service';
import { mediaIdParamSchema, mediaListQuerySchema, mediaPatchSchema } from '@/validations/media-schema';

// The client's Content-Type and filename are never trusted: the service sniffs the bytes.
async function fileFrom(c: Context) {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) {
    const message = 'Choose a file to upload';
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 422, { file: [message] });
  }
  return file;
}

// Phase 2 swaps `requireAuth` for RBAC `media.*` permissions.
export const adminMedia = new Hono<AuthEnv>()
  .use('*', requireAuth)

  .get('/', zValidator('query', mediaListQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const { items, total } = await mediaLibraryService.list(query);
    return ok(c, items, { pagination: buildPagination(total, query.page, query.limit) });
  })

  .get('/:id', zValidator('param', mediaIdParamSchema), async (c) => {
    return ok(c, await mediaLibraryService.get(c.req.valid('param').id));
  })

  .get('/:id/usage', zValidator('param', mediaIdParamSchema), async (c) => {
    return ok(c, await mediaLibraryService.usageOf(c.req.valid('param').id));
  })

  .post('/', rateLimit(30, 60_000), async (c) => {
    const item = await mediaLibraryService.upload(c.get('user').id, await fileFrom(c));
    return ok(c, item, { status: 201 });
  })

  .patch('/:id', zValidator('param', mediaIdParamSchema), zValidator('json', mediaPatchSchema), async (c) => {
    return ok(c, await mediaLibraryService.update(c.req.valid('param').id, c.req.valid('json')));
  })

  .post('/:id/replace', rateLimit(30, 60_000), zValidator('param', mediaIdParamSchema), async (c) => {
    const item = await mediaLibraryService.replace(c.get('user').id, c.req.valid('param').id, await fileFrom(c));
    return ok(c, item);
  })

  .delete('/:id', zValidator('param', mediaIdParamSchema), async (c) => {
    await mediaLibraryService.remove(c.req.valid('param').id);
    return ok(c, { success: true });
  });
