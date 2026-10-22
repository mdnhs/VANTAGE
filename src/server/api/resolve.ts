import { Hono } from 'hono';
import { after } from 'next/server';
import * as z from 'zod';
import { serverEnv } from '@/lib/env';
import { HIT_HEADER, isHitToken } from '@/lib/seo/hit-token';
import { resolvePath } from '@/lib/seo/route-resolution';
import type { AppEnv } from '@/server/api/types';
import { zValidator } from '@/server/lib/validator';
import { getRedirectTable } from '@/server/queries/get-redirect-table';
import { recordHit } from '@/server/services/redirect-service';

// Public and read-only: answers only what visiting the URL would reveal. proxy.ts calls it
// over loopback. Returns the bare Resolution (not the ok() envelope) because the proxy parses it.
export const resolve = new Hono<AppEnv>().get(
  '/',
  zValidator('query', z.object({ path: z.string().startsWith('/').max(512) })),
  async (c) => {
    const { path } = c.req.valid('query');
    const result = resolvePath(await getRedirectTable(), path);
    // Only the proxy's signed, non-prefetch GET counts as a visit.
    if (result.kind === 'redirect' && isHitToken(serverEnv().AUTH_SECRET, path, c.req.header(HIT_HEADER))) {
      after(() =>
        recordHit(path).catch((error) => console.warn('[redirects] hit not recorded:', error instanceof Error ? error.message : error)),
      );
    }
    c.header('Cache-Control', 'no-store');
    return c.json(result);
  },
);
