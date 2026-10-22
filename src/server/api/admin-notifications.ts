import { Hono } from 'hono';

import type { AppEnv } from '@/server/api/types';
import { ok } from '@/server/lib/response';
import { actorOf, can } from '@/server/middleware/auth';
import { notViewingAs } from '@/server/middleware/view-as';
import { listNotifications, markNotificationsSeen } from '@/server/services/notifications-service';

export const adminNotifications = new Hono<AppEnv>()
  .get('/', can({ dashboard: ['view'] }), async (c) => ok(c, await listNotifications(actorOf(c))))
  .post(
    '/seen',
    can({ dashboard: ['view'] }),
    notViewingAs('Viewing as someone never marks their notifications as read'),
    async (c) => ok(c, await markNotificationsSeen(actorOf(c))),
  );
