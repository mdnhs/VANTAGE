import { Hono } from 'hono';
import * as z from 'zod';
import { RedirectInput, RedirectListQuery, RedirectPatch } from '@/lib/seo/redirect-rules';
import type { AppEnv } from '@/server/api/types';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorOf, can } from '@/server/middleware/auth';
import { notViewingAs, VIEW_AS_READ_ONLY } from '@/server/middleware/view-as';
import {
  createManualRedirect,
  deleteRedirect,
  listRedirects,
  updateRedirect,
} from '@/server/services/redirect-service';

const idParam = z.object({ id: z.uuid() });

export const adminRedirects = new Hono<AppEnv>()
  .get('/', can({ redirect: ['read'] }), zValidator('query', RedirectListQuery), async (c) => {
    const query = c.req.valid('query');
    const { rows, total } = await listRedirects(query);
    return ok(c, rows, { pagination: buildPagination(total, query.page, query.limit) });
  })

  .post(
    '/',
    can({ redirect: ['manage'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('json', RedirectInput),
    async (c) => {
      return ok(c, await createManualRedirect(actorOf(c), c.req.valid('json')), { status: 201 });
    },
  )

  .patch(
    '/:id',
    can({ redirect: ['manage'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('param', idParam),
    zValidator('json', RedirectPatch),
    async (c) => {
      return ok(c, await updateRedirect(actorOf(c), c.req.valid('param').id, c.req.valid('json')));
    },
  )

  .delete(
    '/:id',
    can({ redirect: ['manage'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('param', idParam),
    async (c) => {
      await deleteRedirect(actorOf(c), c.req.valid('param').id);
      return ok(c, { success: true });
    },
  );
