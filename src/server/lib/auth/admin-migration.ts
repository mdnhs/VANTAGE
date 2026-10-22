import { randomUUID } from 'node:crypto';

import { asc, eq, inArray, sql } from 'drizzle-orm';

import type { RoleName } from '@/lib/auth/permissions';
import { PERMISSIONS, type PermissionValue } from '@/lib/permission/permissions';
import { decompressPermissions } from '@/lib/permission/utils';
import { db } from '@/server/db';
import { accounts, adminUsers, users } from '@/server/db/schema';

// Legacy admin_users -> Better Auth users/accounts. Each user keeps the admin
// row's id (as text), so quote_requests.assigned_admin_id copies straight over.

type LegacyAdmin = Pick<typeof adminUsers.$inferSelect, 'role' | 'permissionsBitfield'>;

const ALL = Object.values(PERMISSIONS) as PermissionValue[];

// Legacy login treated role = 'admin' as holding every permission.
function effectivePermissions(admin: LegacyAdmin): PermissionValue[] {
  const decoded = decompressPermissions(admin.permissionsBitfield);
  return admin.role === 'admin' || decoded.includes(PERMISSIONS.ADMINS_MANAGE) ? ALL : decoded;
}

export function mapRole(admin: LegacyAdmin): RoleName {
  const perms = effectivePermissions(admin);
  if (perms.includes(PERMISSIONS.ADMINS_MANAGE)) return 'owner';
  const content = perms.some((p) => p.startsWith('content.'));
  const leads = perms.some((p) => p.startsWith('leads.'));
  if (content && leads) return 'admin';
  if (content) return 'editor';
  if (leads) return 'intake';
  return 'viewer';
}

type FullAdmin = typeof adminUsers.$inferSelect;

// Role per admin id. When nobody would be an owner (and none exists already),
// the oldest active admin becomes one.
function assignRoles(admins: FullAdmin[], existingOwner: boolean): Map<string, RoleName> {
  const roles = new Map(admins.map((a) => [a.id, mapRole(a)]));
  const anyOwner = existingOwner || [...roles.values()].includes('owner');
  if (!anyOwner) {
    const oldest = admins.filter((a) => a.isActive).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    if (oldest) roles.set(oldest.id, 'owner');
  }
  return roles;
}

export type MigrationPlanRow = { email: string; role: RoleName; banned: boolean; action: 'create' | 'skip' };
export type MigrationResult = {
  dryRun: boolean;
  plan: MigrationPlanRow[];
  created: number;
  skipped: number;
  quotesLinked: number;
};

const norm = (email: string) => email.trim().toLowerCase();

export async function migrateAdmins({ dryRun = false }: { dryRun?: boolean } = {}): Promise<MigrationResult> {
  return db.transaction(async (tx) => {
    const admins = await tx.select().from(adminUsers).orderBy(asc(adminUsers.createdAt));
    const existing = await tx.select({ email: users.email, role: users.role }).from(users);
    const existingEmails = new Set(existing.map((u) => u.email));
    const existingOwner = existing.some((u) => u.role === 'owner');

    const toCreate = admins.filter((a) => !existingEmails.has(norm(a.email)));
    const roles = assignRoles(toCreate, existingOwner);

    const plan: MigrationPlanRow[] = admins.map((a) => {
      const skip = existingEmails.has(norm(a.email));
      return {
        email: norm(a.email),
        role: skip ? (existing.find((u) => u.email === norm(a.email))!.role as RoleName) : roles.get(a.id)!,
        banned: !a.isActive,
        action: skip ? 'skip' : 'create',
      };
    });

    if (dryRun) {
      const pending = await tx.execute(
        sql`select count(*)::int as n from quote_requests where assigned_admin_id is not null and assigned_user_id is null`,
      );
      return {
        dryRun,
        plan,
        created: toCreate.length,
        skipped: admins.length - toCreate.length,
        quotesLinked: Number((pending.rows[0] as { n: number }).n),
      };
    }

    for (const a of toCreate) {
      await tx.insert(users).values({
        id: a.id,
        name: a.name,
        email: norm(a.email),
        emailVerified: true,
        role: roles.get(a.id)!,
        banned: !a.isActive,
        createdAt: a.createdAt,
      });
      await tx.insert(accounts).values({
        id: randomUUID(),
        userId: a.id,
        accountId: a.id,
        providerId: 'credential',
        password: a.passwordHash,
      });
    }

    // Only assignments whose admin now has a user row (a skipped email keeps its own id).
    const linked = await tx.execute(sql`
      update quote_requests q set assigned_user_id = q.assigned_admin_id::text
      where q.assigned_admin_id is not null and q.assigned_user_id is null
        and exists (select 1 from users u where u.id = q.assigned_admin_id::text)
    `);

    return {
      dryRun,
      plan,
      created: toCreate.length,
      skipped: admins.length - toCreate.length,
      quotesLinked: linked.rowCount ?? 0,
    };
  });
}

export type VerifyResult = { ok: boolean; problems: string[]; checked: number };

export async function verifyAdminMigration(): Promise<VerifyResult> {
  const admins = await db.select().from(adminUsers);
  const adminIds = admins.map((a) => a.id);
  const problems: string[] = [];

  const migrated = adminIds.length ? await db.select().from(users).where(inArray(users.id, adminIds)) : [];
  const byId = new Map(migrated.map((u) => [u.id, u]));
  const allUsers = await db.select({ id: users.id, email: users.email, role: users.role }).from(users);
  const ownedElsewhere = allUsers.some((u) => u.role === 'owner' && !byId.has(u.id));
  const roles = assignRoles(
    admins.filter((a) => byId.has(a.id)),
    ownedElsewhere,
  );
  const emails = new Set(allUsers.map((u) => u.email));

  for (const a of admins) {
    const email = norm(a.email);
    const user = byId.get(a.id);
    if (!user) {
      // An email that already had a (different) account was skipped on purpose.
      if (!emails.has(email)) problems.push(`${email}: no users row`);
      continue;
    }
    if (user.email !== email) problems.push(`${email}: email differs`);
    if (user.role !== roles.get(a.id)) problems.push(`${email}: role ${user.role}, expected ${roles.get(a.id)}`);
    if (user.banned !== !a.isActive) problems.push(`${email}: banned flag mismatch`);
    if (!user.emailVerified) problems.push(`${email}: email not verified`);
    const [account] = await db.select().from(accounts).where(eq(accounts.userId, a.id));
    if (!account || account.providerId !== 'credential' || account.accountId !== a.id) {
      problems.push(`${email}: credential account missing`);
    } else if (account.password !== a.passwordHash) {
      problems.push(`${email}: password hash not carried over`);
    }
  }

  const unlinked = await db.execute(sql`
    select count(*)::int as n from quote_requests q
    where q.assigned_admin_id is not null and q.assigned_user_id is distinct from q.assigned_admin_id::text
      and exists (select 1 from users u where u.id = q.assigned_admin_id::text)
  `);
  const n = Number((unlinked.rows[0] as { n: number }).n);
  if (n > 0) problems.push(`${n} quote assignment(s) not copied to assigned_user_id`);

  const [{ n: owners }] = (await db.execute(sql`select count(*)::int as n from users where role = 'owner'`)).rows as {
    n: number;
  }[];
  if (admins.length > 0 && Number(owners) === 0) problems.push('no owner exists');

  return { ok: problems.length === 0, problems, checked: admins.length };
}
