import { and, isNotNull, ne } from 'drizzle-orm';
import { Hono } from 'hono';
import { hasPermission, parseRoles } from '@/lib/auth/permissions';
import type { AppEnv } from '@/server/api/types';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { isBanned } from '@/server/lib/auth/fresh-session';
import { ok } from '@/server/lib/response';
import { can } from '@/server/middleware/auth';

// Staff who can be given a quote: active users whose roles may update quotes.
// Lets intake staff fill the assignee dropdown without `user[list]`.
export const adminUsersLookup = new Hono<AppEnv>().get('/assignees', can({ quote: ['read'] }), async (c) => {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      banned: users.banned,
      banExpires: users.banExpires,
    })
    .from(users)
    .where(and(isNotNull(users.role), ne(users.role, 'user')));
  const assignees = rows
    .filter((u) => !isBanned(u) && hasPermission(parseRoles(u.role), { quote: ['update'] }))
    .map(({ id, name, email }) => ({ id, name, email }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return ok(c, assignees);
});
