import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '@/server/api/types';
import { ok, buildPagination } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorLimit, INVITE_LIMIT, VIEW_AS_LIMIT } from '@/server/middleware/actor-limit';
import { actorOf, can } from '@/server/middleware/auth';
import { notViewingAs } from '@/server/middleware/view-as';
import * as manage from '@/server/services/user-admin/manage';
import { inviteUser } from '@/server/services/user-admin/service';
import { startViewAs } from '@/server/services/user-admin/view-as';
import { BanInput, InviteInput, RolesInput, UserListQuery } from '@/validations/user-admin-schema';

const id = zValidator('param', z.object({ id: z.string().min(1).max(128) }));
const viewing = notViewingAs("Access can't be changed while viewing as someone");

// Users & roles. Validate, authorise, call the service. Owner protection,
// the access lock and the audit trail live in the service.
export const adminUsers = new Hono<AppEnv>()
  .get('/', can({ user: ['list'] }), zValidator('query', UserListQuery), async (c) => {
    const query = c.req.valid('query');
    const { items, total } = await manage.listUsers(query);
    return ok(c, items, { pagination: buildPagination(total, query.page, query.pageSize) });
  })
  .post(
    '/invite',
    can({ user: ['create'] }),
    viewing,
    actorLimit('invite', INVITE_LIMIT),
    zValidator('json', InviteInput),
    async (c) => ok(c, await inviteUser(actorOf(c), c.req.valid('json'), c.req.raw.headers), { status: 201 }),
  )
  .patch('/:id/role', can({ user: ['set-role'] }), viewing, id, zValidator('json', RolesInput), async (c) =>
    ok(c, await manage.setRoles(actorOf(c), c.req.valid('param').id, c.req.valid('json'))),
  )
  .post('/:id/ban', can({ user: ['ban'] }), viewing, id, zValidator('json', BanInput), async (c) =>
    ok(c, await manage.banUser(actorOf(c), c.req.valid('param').id, c.req.valid('json'))),
  )
  .post('/:id/unban', can({ user: ['ban'] }), viewing, id, async (c) =>
    ok(c, await manage.unbanUser(actorOf(c), c.req.valid('param').id)),
  )
  .delete('/:id/sessions', can({ session: ['revoke'] }), viewing, id, async (c) =>
    ok(c, await manage.revokeUserSessions(actorOf(c), c.req.valid('param').id)),
  )
  .post('/:id/resend-invite', can({ user: ['create'] }), viewing, actorLimit('invite', INVITE_LIMIT), id, async (c) =>
    ok(c, await manage.resendInvite(actorOf(c), c.req.valid('param').id)),
  )
  .delete('/:id', can({ user: ['delete'] }), viewing, id, async (c) =>
    ok(c, await manage.deleteUser(actorOf(c), c.req.valid('param').id)),
  )
  .post(
    '/:id/impersonate',
    can({ user: ['impersonate'] }),
    notViewingAs('Stop viewing as this person before viewing as someone else'),
    actorLimit('view-as', VIEW_AS_LIMIT),
    id,
    async (c) => {
      const cookies = await startViewAs(actorOf(c), c.req.valid('param').id, c.req.raw.headers);
      for (const cookie of cookies) c.header('Set-Cookie', cookie, { append: true });
      return ok(c, { ok: true as const });
    },
  );
