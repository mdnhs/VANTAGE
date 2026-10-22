import { Hono } from 'hono';
import { draftMode } from 'next/headers';
import { z } from 'zod';

import { PreviewPath } from '@/lib/theme/preview-path';
import type { AppEnv } from '@/server/api/types';
import { zValidator } from '@/server/lib/validator';
import { can } from '@/server/middleware/auth';

// Hono runs inside the Next Route Handler, so draftMode() has its request store and
// Next merges the (unforgeable) bypass cookie it sets into our redirect.
export const preview = new Hono<AppEnv>()
  .get(
    '/',
    can({ appearance: ['read'] }),
    zValidator('query', z.object({ path: PreviewPath.default('/') })),
    async (c) => {
      (await draftMode()).enable();
      return c.redirect(c.req.valid('query').path, 307);
    },
  )
  // Leaving must always work, so an odd path falls back to the home page.
  .get('/exit', zValidator('query', z.object({ path: PreviewPath.catch('/') })), async (c) => {
    (await draftMode()).disable();
    return c.redirect(c.req.valid('query').path, 307);
  });
