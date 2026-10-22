import { Hono } from 'hono';
import type { AppEnv } from '@/server/api/types';
import { rateLimit } from '@/server/middleware/rate-limit';
import { CONSENT_LIMIT, recordConsent } from '@/server/services/consent-service';

// navigator.sendBeacon posts here; the answer is never read.
export const publicConsent = new Hono<AppEnv>().post(
  '/',
  rateLimit(CONSENT_LIMIT.limit, CONSENT_LIMIT.windowMs),
  async (c) => {
    await recordConsent(await c.req.json().catch(() => ({})));
    return c.body(null, 204);
  },
);
