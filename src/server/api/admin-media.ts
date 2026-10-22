import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { ERROR_CODES, ApiError } from '@/server/lib/errors';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { actorOf, can } from '@/server/middleware/auth';
import { rateLimit } from '@/server/middleware/rate-limit';
import { MAX_VIDEO_BYTES } from '@/server/lib/media/process';
import { mediaLibraryService } from '@/server/services/media-library-service';
import { mediaIdParamSchema, mediaListQuerySchema, mediaPatchSchema } from '@/validations/media-schema';

// Refuse oversized bodies before they are buffered by parseBody. The slack
// covers multipart framing around a file of up to MAX_VIDEO_BYTES.
const uploadBodyLimit = bodyLimit({
  maxSize: MAX_VIDEO_BYTES + 1_048_576,
  onError: () => {
    throw ApiError.payloadTooLarge('Files can be up to 100 MB');
  },
});

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

export const adminMedia = new Hono<AppEnv>()
  .get('/', can({ media: ['read'] }), zValidator('query', mediaListQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const { items, total } = await mediaLibraryService.list(query);
    return ok(c, items, { pagination: buildPagination(total, query.page, query.limit) });
  })

  .get('/:id', can({ media: ['read'] }), zValidator('param', mediaIdParamSchema), async (c) => {
    return ok(c, await mediaLibraryService.get(c.req.valid('param').id));
  })

  .get('/:id/usage', can({ media: ['read'] }), zValidator('param', mediaIdParamSchema), async (c) => {
    return ok(c, await mediaLibraryService.usageOf(c.req.valid('param').id));
  })

  .post('/', can({ media: ['upload'] }), rateLimit(30, 60_000), uploadBodyLimit, async (c) => {
    const item = await mediaLibraryService.upload(actorOf(c), await fileFrom(c));
    return ok(c, item, { status: 201 });
  })

  .patch(
    '/:id',
    can({ media: ['update'] }),
    zValidator('param', mediaIdParamSchema),
    zValidator('json', mediaPatchSchema),
    async (c) => {
      return ok(c, await mediaLibraryService.update(actorOf(c), c.req.valid('param').id, c.req.valid('json')));
    },
  )

  .post(
    '/:id/replace',
    can({ media: ['upload'] }),
    rateLimit(30, 60_000),
    uploadBodyLimit,
    zValidator('param', mediaIdParamSchema),
    async (c) => {
      const item = await mediaLibraryService.replace(actorOf(c), c.req.valid('param').id, await fileFrom(c));
      return ok(c, item);
    },
  )

  .delete('/:id', can({ media: ['delete'] }), zValidator('param', mediaIdParamSchema), async (c) => {
    await mediaLibraryService.remove(actorOf(c), c.req.valid('param').id);
    return ok(c, { success: true });
  });
