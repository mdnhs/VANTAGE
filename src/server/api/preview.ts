import { Hono } from 'hono';
import { draftMode } from 'next/headers';
import { z } from 'zod';

import { PreviewPath } from '@/lib/theme/preview-path';
import type { AppEnv } from '@/server/api/types';
import { zValidator } from '@/server/lib/validator';
import { ApiError } from '@/server/lib/errors';
import { canAny } from '@/server/middleware/auth';

// Appearance (theme drafts) and the website page editors (copy drafts) both preview here.
// Entering preview switches draft mode on, so a request another site triggered is refused.
// 'none' (typed URL, new tab) is the user's own doing; browsers that send no header pass.
const OWN_REQUEST = new Set(['same-origin', 'same-site', 'none']);

// Hono runs inside the Next Route Handler, so draftMode() has its request store and
// Next merges the (unforgeable) bypass cookie it sets into our redirect.
export const preview = new Hono<AppEnv>()
  .get(
    '/',
    canAny({ appearance: ['read'] }, { page: ['read'] }),
    zValidator('query', z.object({ path: PreviewPath.default('/') })),
    async (c) => {
      const site = c.req.header('sec-fetch-site');
      if (site !== undefined && !OWN_REQUEST.has(site)) throw ApiError.forbidden('Cross-site preview is not allowed');
      (await draftMode()).enable();
      return c.redirect(c.req.valid('query').path, 307);
    },
  )
  // Leaving must always work, so an odd path falls back to the home page.
  .get('/exit', zValidator('query', z.object({ path: PreviewPath.catch('/') })), async (c) => {
    (await draftMode()).disable();
    return c.redirect(c.req.valid('query').path, 307);
  });
