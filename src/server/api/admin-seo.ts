import { Hono } from 'hono';

import type { AppEnv } from '@/server/api/types';
import { getSeoHealth } from '@/server/queries/get-seo-health';
import { ok } from '@/server/lib/response';
import { can } from '@/server/middleware/auth';

// Read-only: the SEO center overview. Writes to SEO go through /admin/globals/:key.
export const adminSeo = new Hono<AppEnv>().get('/overview', can({ seo: ['read'] }), async (c) =>
  ok(c, await getSeoHealth()),
);
