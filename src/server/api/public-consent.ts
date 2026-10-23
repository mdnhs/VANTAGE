import { Hono } from 'hono';
import type { AppEnv } from '@/server/api/types';
import { rateLimit } from '@/server/middleware/rate-limit';
import { CONSENT_LIMIT, recordConsent } from '@/server/services/consent-service';

// navigator.sendBeacon posts here; the answer is never read. A browser that says the
// request is cross-site is refused; older browsers send no Sec-Fetch-Site and are allowed.
export const publicConsent = new Hono<AppEnv>().post(
  '/',
  async (c, next) => {
    const site = c.req.header('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'same-site') return c.body(null, 403);
    await next();
  },
  rateLimit(CONSENT_LIMIT.limit, CONSENT_LIMIT.windowMs),
  async (c) => {
    await recordConsent(await c.req.json().catch(() => ({})));
    return c.body(null, 204);
  },
);
