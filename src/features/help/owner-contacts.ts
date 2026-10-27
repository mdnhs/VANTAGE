import 'server-only';

import { and, asc, eq, like } from 'drizzle-orm';

import { parseRoles } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { users } from '@/server/db/schema/auth';

import type { OwnerContact } from './content';

// Active owners' names and work emails, for "Who to contact". Every signed-in
// role sees these, including roles that cannot open Users & roles; only name
// and email are read.
export async function listOwnerContacts(): Promise<OwnerContact[]> {
  const rows = await db
    .select({ name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(and(eq(users.banned, false), like(users.role, '%owner%')))
    .orderBy(asc(users.name));
  return rows.filter((row) => parseRoles(row.role).includes('owner')).map(({ name, email }) => ({ name, email }));
}
