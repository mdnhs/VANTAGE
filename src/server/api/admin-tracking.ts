import { Hono } from 'hono';

import type { AppEnv } from '@/server/api/types';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorOf, can } from '@/server/middleware/auth';
import { rateLimit } from '@/server/middleware/rate-limit';
import { notViewingAs, VIEW_AS_READ_ONLY } from '@/server/middleware/view-as';
import { getTrackingAdmin, saveTracking, sendTestEvent } from '@/server/services/tracking-service';
import { TrackingUpdate } from '@/validations/tracking-schema';

export const adminTracking = new Hono<AppEnv>()
  .get('/', can({ tracking: ['read'] }), async (c) => ok(c, await getTrackingAdmin()))

  .put(
    '/',
    can({ tracking: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('json', TrackingUpdate),
    async (c) => ok(c, await saveTracking(actorOf(c), c.req.valid('json'))),
  )

  // Sends one neutral test event to Meta, so the token and Pixel can be checked.
  .post(
    '/test-capi',
    can({ tracking: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    rateLimit(5, 60_000, 'Too many test events. Wait a minute and try again.'),
    async (c) => ok(c, await sendTestEvent(actorOf(c))),
  );
