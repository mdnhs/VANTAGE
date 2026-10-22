import 'server-only';

import { and, eq, gt, isNull } from 'drizzle-orm';

import { describeAgent } from '@/lib/account/describe-agent';
import { db } from '@/server/db';
import { sessions } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import { getAuth } from '@/server/lib/auth';
import type { Actor } from '@/server/lib/auth/actor';
import { ApiError } from '@/server/lib/errors';

// Users list and revoke their own sessions. The browser only ever sees a
// session's id and a device summary: tokens stay here, and IP addresses are
// never sent.
export type DeviceDto = { id: string; device: string; lastActiveAt: string; current: boolean };

// Active sessions the user signed in themselves. A View-as session belongs to
// the admin behind it, not to this user's devices.
function ownSessions(userId: string) {
  return db
    .select({ id: sessions.id, token: sessions.token, userAgent: sessions.userAgent, updatedAt: sessions.updatedAt })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date()), isNull(sessions.impersonatedBy)));
}

// Through Better Auth, so any session storage it keeps stays in step.
async function deleteSessions(tokens: string[]) {
  const { internalAdapter } = await getAuth().$context;
  await internalAdapter.deleteSessions(tokens);
}

export async function listDevices(actor: Actor): Promise<DeviceDto[]> {
  const rows = await ownSessions(actor.userId);
  return rows
    .map((row) => ({
      id: row.id,
      device: describeAgent(row.userAgent),
      lastActiveAt: row.updatedAt.toISOString(),
      current: row.id === actor.sessionId,
    }))
    .sort((a, b) => Number(b.current) - Number(a.current) || b.lastActiveAt.localeCompare(a.lastActiveAt));
}

export async function revokeDevice(actor: Actor, id: string) {
  if (id === actor.sessionId) {
    throw new ApiError('VALIDATION_ERROR', 'Sign out to end the session on this device', 400);
  }
  const [row] = (await ownSessions(actor.userId)).filter((session) => session.id === id);
  // Someone else's, expired or already gone: the same answer for each, so the
  // route reveals nothing about other people's sessions.
  if (!row) throw ApiError.notFound('That device is already signed out');
  await deleteSessions([row.token]);
  await audit(actor, {
    action: 'account.session_revoke',
    entityType: 'session',
    entityId: row.id,
    summary: `Signed out ${describeAgent(row.userAgent)}`,
  });
}

export async function revokeOtherDevices(actor: Actor) {
  const others = (await ownSessions(actor.userId)).filter((session) => session.id !== actor.sessionId);
  if (others.length === 0) return { revoked: 0 };
  await deleteSessions(others.map((session) => session.token));
  await audit(actor, {
    action: 'account.session_revoke',
    entityType: 'session',
    entityId: null,
    summary: others.length === 1 ? 'Signed out 1 other device' : `Signed out ${others.length} other devices`,
  });
  return { revoked: others.length };
}
