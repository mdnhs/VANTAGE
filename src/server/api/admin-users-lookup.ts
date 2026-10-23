import { Hono } from 'hono';
import type { AppEnv } from '@/server/api/types';
import { ok } from '@/server/lib/response';
import { can } from '@/server/middleware/auth';
import { listAssignees } from '@/server/services/user-admin/assignees';

// Lets intake staff fill the assignee dropdown without `user[list]`.
export const adminUsersLookup = new Hono<AppEnv>().get('/assignees', can({ quote: ['read'] }), async (c) =>
  ok(c, await listAssignees()),
);
