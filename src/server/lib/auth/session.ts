import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { noAccessHref } from '@/lib/admin/no-access';
import { ADMIN_PATH_HEADER } from '@/lib/auth/admin-path';
import { hasPermission, parseRoles, type Permissions } from '@/lib/auth/permissions';
import { safeNext } from '@/lib/auth/safe-next';

import { toActor, type Actor } from './actor';
import { getFreshSession } from './fresh-session';

// One full (database-checked) session read per request.
export const getSession = cache(async () => {
  const { session } = await getFreshSession(await headers());
  return session;
});

// The panel's gate: signed in, nothing more. Two-factor is optional for
// every role (change 2026-10-11), so nobody is sent to set it up; a user who
// has it on already passed the challenge to get a session at all.
// Without an explicit `next`, a signed-out visitor returns to the page they
// asked for (set by proxy.ts, since layouts never see the pathname).
export async function requireActor(next?: string): Promise<Actor> {
  const session = await getSession();
  // Site customers (role "user") hold valid sessions but never enter the panel.
  if (!session || parseRoles(session.user.role).length === 0) {
    const target = safeNext(next ?? (await headers()).get(ADMIN_PATH_HEADER));
    redirect(`/login?next=${encodeURIComponent(target)}`);
  }
  return toActor(session);
}

// Page-level gate (layer 2): spares a user a page of
// 403s. The API still authorises every call on its own.
export async function requirePermission(permissions: Permissions, next?: string): Promise<Actor> {
  const actor = await requireActor(next);
  if (!hasPermission(actor.roles, permissions)) {
    // A signed-in admin stays in the panel; the page names what was refused.
    redirect(noAccessHref(next ?? (await headers()).get(ADMIN_PATH_HEADER)));
  }
  return actor;
}
