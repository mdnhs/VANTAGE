import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '@/server/api/types';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorOf, signedIn } from '@/server/middleware/auth';
import { notViewingAs } from '@/server/middleware/view-as';
import { listDevices, revokeDevice, revokeOtherDevices } from '@/server/services/user-admin/account';

// Account self-service belongs to the person, not to an admin viewing as them:
// View-as shows what a role can see, it does not act for the person. Every
// admin role may manage their own devices, so the gate is `signedIn`.
const viewingAs = notViewingAs("Account settings can't be changed while viewing as someone");

export const account = new Hono<AppEnv>()
  .get('/sessions', signedIn, viewingAs, async (c) => ok(c, await listDevices(actorOf(c))))
  .post('/sessions/revoke-others', signedIn, viewingAs, async (c) => ok(c, await revokeOtherDevices(actorOf(c))))
  .delete(
    '/sessions/:id',
    signedIn,
    viewingAs,
    zValidator('param', z.object({ id: z.string().min(1).max(128) })),
    async (c) => {
      await revokeDevice(actorOf(c), c.req.valid('param').id);
      return ok(c, { ok: true as const });
    },
  );
