import 'server-only';

import { and, count, eq, ilike, inArray, ne, or, sql, type SQL } from 'drizzle-orm';

import { hasPermission, parseRoles, type Permissions, type RoleName } from '@/lib/auth/permissions';
import { db, type DbLike } from '@/server/db';
import { accounts, auditLogs, sessions, users } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { inviteRedirect } from '@/server/lib/auth/bootstrap';
import { captureAuthLinks } from '@/server/lib/auth/email';
import { isBanned } from '@/server/lib/auth/fresh-session';
import { getAuth } from '@/server/lib/auth';
import { ApiError } from '@/server/lib/errors';
import { joinRoles, type BanInput, type RolesInput, type UserListQuery } from '@/validations/user-admin-schema';

import { losesOwner, refusal, type ManageAction } from './guard';

export type UserDto = {
  id: string;
  name: string;
  email: string;
  roles: RoleName[];
  twoFactorEnabled: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  invitePending: boolean;
  lastActiveAt: string | null;
  createdAt: string;
};

export type TargetRow = {
  id: string;
  name: string;
  email: string;
  roles: RoleName[];
  role: string | null;
  banned: boolean;
  banExpires: Date | null;
  twoFactorEnabled: boolean;
};

const ownerSql = sql`'owner' = any(string_to_array(${users.role}, ','))`;
// Better Auth lifts a ban once ban_expires has passed.
const activeSql = sql`(${users.banned} is not true or (${users.banExpires} is not null and ${users.banExpires} <= now()))`;

// Drizzle drops the table prefix from columns in a single-table select, so a
// bare ${users.id} inside these correlated subqueries would bind to the
// subquery's own "id". Qualify it by hand.
const userId = sql.raw('"users"."id"');
const lastSession = sql<Date | null>`(select max(s.updated_at) from ${sessions} s where s.user_id = ${userId} and s.impersonated_by is null)`;
const lastSignIn = sql<Date | null>`(select max(a.created_at) from ${auditLogs} a where a.entity_type = 'user' and a.entity_id = ${userId} and a.action = 'auth.sign_in')`;
const pending = sql<boolean>`not exists (select 1 from ${accounts} ac where ac.user_id = ${userId} and ac.provider_id = 'credential')`;

// Customers (role `user`) have no admin role: these tools don't see them.
export const NO_ACCOUNT = 'That person no longer has an account';

const escapeLike = (q: string) => q.replace(/[\\%_]/g, (c) => `\\${c}`);

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

function filters(query: UserListQuery): SQL | undefined {
  const parts: SQL[] = [];
  if (query.q) {
    const like = `%${escapeLike(query.q)}%`;
    parts.push(or(ilike(users.name, like), ilike(users.email, like))!);
  }
  if (query.role) parts.push(sql`${query.role} = any(string_to_array(${users.role}, ','))`);
  if (query.status === 'banned') parts.push(sql`not ${activeSql}`);
  if (query.status === 'active') parts.push(and(activeSql, sql`not ${pending}`)!);
  if (query.status === 'invited') parts.push(pending);
  if (query.status === 'no-2fa') parts.push(sql`${users.twoFactorEnabled} is not true`);
  return parts.length ? and(...parts) : undefined;
}

// The customer role is never an admin account: staff listings leave it out.
const staffOnly = ne(users.role, 'user');

function selectUsers(dbLike: DbLike) {
  return dbLike
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      twoFactorEnabled: users.twoFactorEnabled,
      banned: users.banned,
      banReason: users.banReason,
      banExpires: users.banExpires,
      createdAt: users.createdAt,
      lastSession,
      lastSignIn,
      invitePending: pending,
    })
    .from(users);
}

type Row = Awaited<ReturnType<ReturnType<typeof selectUsers>['where']>>[number];

function toDto(row: Row): UserDto {
  const times = [row.lastSession, row.lastSignIn].filter((t): t is Date => t != null).map((t) => new Date(t).getTime());
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roles: parseRoles(row.role),
    twoFactorEnabled: Boolean(row.twoFactorEnabled),
    banned: Boolean(row.banned),
    banReason: row.banReason ?? null,
    banExpires: iso(row.banExpires),
    invitePending: Boolean(row.invitePending),
    lastActiveAt: times.length ? new Date(Math.max(...times)).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export async function listUsers(query: UserListQuery) {
  const where = and(staffOnly, filters(query));
  const [rows, [{ total }]] = await Promise.all([
    selectUsers(db)
      .where(where)
      .orderBy(users.name, users.email, users.id)
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(users).where(where),
  ]);
  return { items: rows.map(toDto), page: query.page, pageSize: query.pageSize, total };
}

export async function getUser(id: string, dbLike: DbLike = db) {
  const [row] = await selectUsers(dbLike).where(eq(users.id, id));
  if (!row) throw ApiError.notFound('That person no longer has an account');
  return toDto(row);
}

export async function activeOwnersExcept(dbLike: DbLike, id: string) {
  const [{ n }] = await dbLike
    .select({ n: count() })
    .from(users)
    .where(and(ne(users.id, id), ownerSql, activeSql, sql`not ${pending}`));
  return n;
}

async function readTargets(dbLike: DbLike, ids: string[]) {
  const rows = await dbLike
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      banned: users.banned,
      banExpires: users.banExpires,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(inArray(users.id, ids));
  return rows.map((r): TargetRow => ({
    ...r,
    roles: parseRoles(r.role),
    banned: Boolean(r.banned),
    twoFactorEnabled: Boolean(r.twoFactorEnabled),
  }));
}

export async function loadTarget(id: string): Promise<TargetRow> {
  const [row] = await readTargets(db, [id]);
  if (!row) throw ApiError.notFound('That person no longer has an account');
  return row;
}

// One lock serialises every access change, so the guard and the last-owner
// count see the state the write will commit on top of.
export async function underAccessLock<T>(
  actor: Actor,
  permission: Permissions,
  id: string,
  action: ManageAction,
  nextRoles: readonly RoleName[] | undefined,
  write: (tx: DbLike, target: TargetRow) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('users:access'))`);
    const rows = await readTargets(tx, [actor.userId, id]);
    const me = rows.find((r) => r.id === actor.userId);
    const target = rows.find((r) => r.id === id);
    // Roles or a ban may have changed since the request's session was read
    // (a concurrent ban by the other owner).
    if (!me || isBanned(me) || !hasPermission(me.roles, permission)) {
      throw ApiError.forbidden("You don't have permission to do that");
    }
    if (!target || target.roles.length === 0) throw ApiError.notFound(NO_ACCOUNT);
    const why = refusal({ userId: me.id, roles: me.roles }, target, action, nextRoles);
    if (why) throw ApiError.forbidden(why);
    if (losesOwner(target, action, nextRoles) && (await activeOwnersExcept(tx, id)) === 0) {
      throw ApiError.lastOwner();
    }
    return write(tx, target);
  });
}

// The person's devices, and every View-as session they started.
async function dropSessions(tx: DbLike, id: string) {
  const gone = await tx
    .delete(sessions)
    .where(or(eq(sessions.userId, id), eq(sessions.impersonatedBy, id)))
    .returning({ id: sessions.id, userId: sessions.userId });
  return gone.filter((s) => s.userId === id).length;
}

export async function setRoles(actor: Actor, id: string, input: RolesInput) {
  return underAccessLock(actor, { user: ['set-role'] }, id, 'set-role', input.roles, async (tx, target) => {
    const next = joinRoles(input.roles);
    if (next !== target.role) {
      await tx.update(users).set({ role: next, updatedAt: new Date() }).where(eq(users.id, id));
      // A role change signs the person out of every device and ends every
      // View-as session they started or are viewed in.
      const revoked = await dropSessions(tx, id);
      await audit(
        actor,
        {
          action: 'user.role',
          entityType: 'user',
          entityId: id,
          summary: `Changed ${target.email}'s role to ${input.roles.join(', ')}`,
          diff: {
            role: { from: target.role, to: next },
            ...(revoked ? { revokedSessions: { from: null, to: revoked } } : {}),
          },
        },
        tx,
      );
    }
    return getUser(id, tx);
  });
}

export async function banUser(actor: Actor, id: string, input: BanInput) {
  return underAccessLock(actor, { user: ['ban'] }, id, 'ban', undefined, async (tx, target) => {
    const banExpires = input.days ? new Date(Date.now() + input.days * 86_400_000) : null;
    await tx
      .update(users)
      .set({ banned: true, banReason: input.reason ?? null, banExpires, updatedAt: new Date() })
      .where(eq(users.id, id));
    const revoked = await dropSessions(tx, id);
    await audit(
      actor,
      {
        action: 'user.ban',
        entityType: 'user',
        entityId: id,
        summary: input.days
          ? `Banned ${target.email} for ${input.days} day${input.days === 1 ? '' : 's'}`
          : `Banned ${target.email} until unbanned`,
        diff: { banned: { from: target.banned, to: true }, revokedSessions: { from: null, to: revoked } },
      },
      tx,
    );
    return getUser(id, tx);
  });
}

export async function unbanUser(actor: Actor, id: string) {
  return underAccessLock(actor, { user: ['ban'] }, id, 'unban', undefined, async (tx, target) => {
    if (target.banned) {
      await tx
        .update(users)
        .set({ banned: false, banReason: null, banExpires: null, updatedAt: new Date() })
        .where(eq(users.id, id));
      await audit(
        actor,
        {
          action: 'user.unban',
          entityType: 'user',
          entityId: id,
          summary: `Unbanned ${target.email}`,
          diff: { banned: { from: true, to: false } },
        },
        tx,
      );
    }
    return getUser(id, tx);
  });
}

export async function revokeUserSessions(actor: Actor, id: string) {
  return underAccessLock(actor, { session: ['revoke'] }, id, 'revoke', undefined, async (tx, target) => {
    const revoked = await dropSessions(tx, id);
    await audit(
      actor,
      {
        action: 'user.sessions_revoke',
        entityType: 'user',
        entityId: id,
        summary: `Signed ${target.email} out everywhere (${revoked} device${revoked === 1 ? '' : 's'})`,
      },
      tx,
    );
    return { revoked };
  });
}

export async function deleteUser(actor: Actor, id: string) {
  return underAccessLock(actor, { user: ['delete'] }, id, 'delete', undefined, async (tx, target) => {
    await dropSessions(tx, id);
    // Accounts, sessions and two_factors cascade; audit rows keep the email.
    await tx.delete(users).where(eq(users.id, id));
    await audit(
      actor,
      { action: 'user.delete', entityType: 'user', entityId: id, summary: `Deleted ${target.email}` },
      tx,
    );
    return { ok: true as const };
  });
}

// Without SMTP the new set-password link comes back as `manualLink`.
export async function resendInvite(actor: Actor, id: string) {
  const target = await loadTarget(id);
  if (target.roles.length === 0) throw ApiError.notFound(NO_ACCOUNT);
  const why = refusal(actor, target, 'resend');
  if (why) throw ApiError.forbidden(why);
  const { invitePending } = await getUser(id);
  if (!invitePending) throw ApiError.conflict("They've already set a password and can sign in");
  const { links } = await captureAuthLinks(() =>
    getAuth().api.requestPasswordReset({ body: { email: target.email, redirectTo: inviteRedirect() } }),
  );
  await audit(actor, {
    action: 'user.invite_resend',
    entityType: 'user',
    entityId: id,
    summary: `Re-sent the invitation to ${target.email}`,
  });
  return { ok: true as const, ...(links[0] ? { manualLink: links[0] } : {}) };
}
