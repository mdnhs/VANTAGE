import { Hono } from 'hono';

import type { AppEnv } from '@/server/api/types';
import { issueStamp } from '@/server/lib/enquiries/stamp';
import { ok } from '@/server/lib/response';
import { rateLimit } from '@/server/middleware/rate-limit';

// The public forms fetch a signed timestamp on mount; this keeps the pages static. Never cached.
export const publicStamp = new Hono<AppEnv>().get('/', rateLimit(60, 60_000), (c) => {
  c.header('Cache-Control', 'no-store');
  return ok(c, { stamp: issueStamp() });
});
