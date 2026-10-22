import { Hono } from 'hono';

import type { AppEnv } from '@/server/api/types';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorOf, can } from '@/server/middleware/auth';
import { rateLimit } from '@/server/middleware/rate-limit';
import { notViewingAs } from '@/server/middleware/view-as';
import { getTrackingAdmin, saveTracking, sendTestEvent } from '@/server/services/tracking-service';
import { TrackingUpdate } from '@/validations/tracking-schema';

const READ_ONLY_VIEW_AS = 'View-as is read-only: settings cannot be changed';

export const adminTracking = new Hono<AppEnv>()
  .get('/', can({ tracking: ['read'] }), async (c) => ok(c, await getTrackingAdmin()))

  .put(
    '/',
    can({ tracking: ['update'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    zValidator('json', TrackingUpdate),
    async (c) => ok(c, await saveTracking(actorOf(c), c.req.valid('json'))),
  )

  // Sends one neutral test event to Meta, so the token and Pixel can be checked.
  .post(
    '/test-capi',
    can({ tracking: ['update'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    rateLimit(5, 60_000, 'Too many test events. Wait a minute and try again.'),
    async (c) => ok(c, await sendTestEvent(actorOf(c))),
  );
