import 'server-only';

import { and, isNotNull, ne } from 'drizzle-orm';

import { hasPermission, parseRoles } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { isBanned } from '@/server/lib/auth/fresh-session';

// Staff who can be given a quote: active users whose roles may update quotes.
export async function listAssignees() {
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
  return rows
    .filter((u) => !isBanned(u) && hasPermission(parseRoles(u.role), { quote: ['update'] }))
    .map(({ id, name, email }) => ({ id, name, email }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
