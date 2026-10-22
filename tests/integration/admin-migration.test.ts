import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PERMISSIONS, type PermissionValue } from '@/lib/permission/permissions';
import { compressPermissions } from '@/lib/permission/utils';
import { db } from '@/server/db';
import { DEMO_USERS, seedDemoUsers } from '@/server/db/seed-demo-users';
import { accounts, adminUsers, auditLogs, quoteRequests, users } from '@/server/db/schema';
import { getAuth, resetAuthForTests } from '@/server/lib/auth';
import { mapRole, migrateAdmins, verifyAdminMigration } from '@/server/lib/auth/admin-migration';
import { createOwner, isDuplicateUserError, provisionUser } from '@/server/lib/auth/bootstrap';

const P = PERMISSIONS;
const CONTENT: PermissionValue[] = [P.SERVICES_MANAGE, P.PROJECTS_MANAGE, P.SETTINGS_MANAGE];
const LEADS: PermissionValue[] = [P.QUOTES_MANAGE, P.CONTACTS_MANAGE];
const PASSWORD = 'Legacy-pass-1';

const ids = {
  owner: '11111111-1111-4111-8111-111111111111',
  editor: '22222222-2222-4222-8222-222222222222',
  intake: '33333333-3333-4333-8333-333333333333',
  gone: '44444444-4444-4444-8444-444444444444',
  none: '55555555-5555-4555-8555-555555555555',
};

const wipe = () =>
  db.execute(sql`truncate table audit_logs, quote_requests, admin_users, users, verifications cascade`);

async function seedAdmins() {
  const hash = bcrypt.hashSync(PASSWORD, 4);
  await db.insert(adminUsers).values([
    {
      id: ids.owner,
      email: 'Owner@Legacy.test',
      name: 'Old Owner',
      passwordHash: hash,
      role: 'admin',
      permissionsBitfield: compressPermissions([...CONTENT, ...LEADS, P.ADMINS_MANAGE]),
      createdAt: new Date('2024-01-01'),
    },
    {
      id: ids.editor,
      email: 'editor@legacy.test',
      name: 'Old Editor',
      passwordHash: hash,
      role: 'editor',
      permissionsBitfield: compressPermissions(CONTENT),
      createdAt: new Date('2024-02-01'),
    },
    {
      id: ids.intake,
      email: 'intake@legacy.test',
      name: 'Old Intake',
      passwordHash: hash,
      role: 'editor',
      permissionsBitfield: compressPermissions(LEADS),
      createdAt: new Date('2024-03-01'),
    },
    {
      id: ids.gone,
      email: 'gone@legacy.test',
      name: 'Inactive',
      passwordHash: hash,
      role: 'editor',
      permissionsBitfield: compressPermissions(CONTENT),
      isActive: false,
      createdAt: new Date('2024-04-01'),
    },
    {
      id: ids.none,
      email: 'none@legacy.test',
      name: 'Nothing',
      passwordHash: hash,
      role: 'editor',
      permissionsBitfield: compressPermissions([P.USERS_MANAGE]),
      createdAt: new Date('2024-05-01'),
    },
  ]);
}

describe('mapRole', () => {
  const bits = (p: PermissionValue[]) => compressPermissions(p);
  it('maps permission sets to roles', () => {
    expect(mapRole({ role: 'editor', permissionsBitfield: bits([P.ADMINS_MANAGE]) })).toBe('owner');
    expect(mapRole({ role: 'admin', permissionsBitfield: '' })).toBe('owner');
    expect(mapRole({ role: 'editor', permissionsBitfield: bits([...CONTENT, ...LEADS]) })).toBe('admin');
    expect(mapRole({ role: 'editor', permissionsBitfield: bits(CONTENT) })).toBe('editor');
    expect(mapRole({ role: 'editor', permissionsBitfield: bits(LEADS) })).toBe('intake');
    expect(mapRole({ role: 'editor', permissionsBitfield: '' })).toBe('viewer');
  });
});

describe('admin migration', () => {
  beforeEach(async () => {
    resetAuthForTests();
    await wipe();
  });
  afterEach(wipe);

  it('dry run plans without writing', async () => {
    await seedAdmins();
    const result = await migrateAdmins({ dryRun: true });
    expect(result.plan.map((p) => [p.email, p.role]).sort()).toEqual([
      ['editor@legacy.test', 'editor'],
      ['gone@legacy.test', 'editor'],
      ['intake@legacy.test', 'intake'],
      ['none@legacy.test', 'viewer'],
      ['owner@legacy.test', 'owner'],
    ]);
    expect(JSON.stringify(result)).not.toContain('$2');
    expect(await db.select().from(users)).toHaveLength(0);
  });

  it('migrates users, accounts and quote assignments; bcrypt password still signs in', async () => {
    await seedAdmins();
    const [quote] = await db
      .insert(quoteRequests)
      .values({ name: 'Q', email: 'q@x.test', phone: '1', assignedAdminId: ids.editor })
      .returning();

    const result = await migrateAdmins({});
    expect(result.created).toBe(5);

    const byEmail = Object.fromEntries((await db.select().from(users)).map((u) => [u.email, u]));
    expect(byEmail['owner@legacy.test']).toMatchObject({
      id: ids.owner,
      role: 'owner',
      banned: false,
      emailVerified: true,
    });
    expect(byEmail['editor@legacy.test']!.role).toBe('editor');
    expect(byEmail['intake@legacy.test']!.role).toBe('intake');
    expect(byEmail['gone@legacy.test']).toMatchObject({ role: 'editor', banned: true });
    expect(byEmail['none@legacy.test']!.role).toBe('viewer');

    const [account] = await db.select().from(accounts).where(eq(accounts.userId, ids.editor));
    expect(account).toMatchObject({ providerId: 'credential', accountId: ids.editor });

    const [q] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, quote!.id));
    expect(q!.assignedUserId).toBe(ids.editor);

    const { response } = await getAuth().api.signInEmail({
      body: { email: 'editor@legacy.test', password: PASSWORD },
      returnHeaders: true,
    });
    expect(response.user.id).toBe(ids.editor);

    expect((await verifyAdminMigration()).ok).toBe(true);
  });

  it('is idempotent', async () => {
    await seedAdmins();
    await migrateAdmins({});
    const again = await migrateAdmins({});
    expect(again.created).toBe(0);
    expect(again.skipped).toBe(5);
    expect(await db.select().from(users)).toHaveLength(5);
    expect((await verifyAdminMigration()).ok).toBe(true);
  });

  it('promotes the oldest active admin to owner when none results', async () => {
    await seedAdmins();
    await db
      .update(adminUsers)
      .set({ role: 'editor', permissionsBitfield: compressPermissions(CONTENT) })
      .where(eq(adminUsers.id, ids.owner));
    await migrateAdmins({});
    const [u] = await db.select().from(users).where(eq(users.id, ids.owner));
    expect(u!.role).toBe('owner');
    expect((await verifyAdminMigration()).ok).toBe(true);
  });

  it('verify fails on a role mismatch', async () => {
    await seedAdmins();
    await migrateAdmins({});
    await db.update(users).set({ role: 'viewer' }).where(eq(users.id, ids.editor));
    const result = await verifyAdminMigration();
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toContain('editor@legacy.test');
  });

  it('verify fails when an assignment was not copied', async () => {
    await seedAdmins();
    await migrateAdmins({});
    await db.insert(quoteRequests).values({ name: 'Q', email: 'q@x.test', phone: '1', assignedAdminId: ids.editor });
    const result = await verifyAdminMigration();
    expect(result.ok).toBe(false);
  });
});

describe('createOwner', () => {
  beforeEach(async () => {
    resetAuthForTests();
    await wipe();
  });
  afterEach(wipe);

  it('creates an owner, audits it and returns a manual link without SMTP', async () => {
    const result = await createOwner({ email: 'Boss@Example.test', name: 'Boss' });
    expect(result.manualLink).toMatch(/^https?:\/\//);
    const [u] = await db.select().from(users).where(eq(users.email, 'boss@example.test'));
    expect(u!.role).toBe('owner');
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, 'user.bootstrap-owner'));
    expect(logs).toHaveLength(1);
    expect(JSON.stringify(logs[0])).not.toContain(result.manualLink!);
  });

  it('refuses a duplicate email', async () => {
    await createOwner({ email: 'boss@example.test', name: 'Boss' });
    await expect(createOwner({ email: 'boss@example.test', name: 'Boss' })).rejects.toThrow(/already/i);
  });
});

describe('demo users', () => {
  beforeEach(async () => {
    resetAuthForTests();
    await wipe();
    delete process.env.SEED_DEMO_USERS;
  });
  afterEach(async () => {
    delete process.env.SEED_DEMO_USERS;
    await wipe();
  });

  it('refuses without SEED_DEMO_USERS=true', async () => {
    await expect(seedDemoUsers()).rejects.toThrow(/SEED_DEMO_USERS/);
    expect(await db.select().from(users)).toHaveLength(0);
  });

  it('creates one user per role, idempotently, and they can sign in', async () => {
    process.env.SEED_DEMO_USERS = 'true';
    const first = await seedDemoUsers();
    expect(first.created).toBe(7);
    const second = await seedDemoUsers();
    expect(second.created).toBe(0);

    const rows = await db.select().from(users);
    expect(rows.map((r) => r.role).sort()).toEqual([
      'admin',
      'author',
      'editor',
      'intake',
      'marketer',
      'owner',
      'viewer',
    ]);
    expect(rows.find((r) => r.email === 'owner@vantage.test')).toMatchObject({ name: 'Olivia Owner', role: 'owner' });

    for (const demo of DEMO_USERS) {
      const { response } = await getAuth().api.signInEmail({
        body: { email: demo.email, password: demo.password },
        returnHeaders: true,
      });
      expect(response.user.email).toBe(demo.email);
    }
  });
});

describe('provisionUser', () => {
  beforeEach(async () => {
    resetAuthForTests();
    await wipe();
  });
  afterEach(wipe);

  it('creates a user with the role and returns a manualLink without SMTP', async () => {
    const result = await provisionUser({ email: 'New@Example.test', name: 'New', role: 'editor' }, { as: 'system' });
    expect(result.user).toMatchObject({ email: 'new@example.test', name: 'New', role: 'editor' });
    expect(result.manualLink).toContain('/reset-password');
    expect(result.manualLink).toContain('invite');
    const [u] = await db.select().from(users).where(eq(users.email, 'new@example.test'));
    expect(u!.role).toBe('editor');
  });

  it('throws a recognisable duplicate error', async () => {
    await provisionUser({ email: 'dup@example.test', name: 'Dup', role: 'viewer' }, { as: 'system' });
    const err = await provisionUser({ email: 'DUP@example.test', name: 'Dup', role: 'viewer' }, { as: 'system' }).catch(
      (e: unknown) => e,
    );
    expect(isDuplicateUserError(err)).toBe(true);
  });
});

describe('admin migration: owners, skips', () => {
  beforeEach(async () => {
    resetAuthForTests();
    await wipe();
  });
  afterEach(wipe);

  it('ignores an inactive owner-capable admin when picking the fallback owner', async () => {
    await seedAdmins();
    await db.update(adminUsers).set({ isActive: false }).where(eq(adminUsers.id, ids.owner));
    await migrateAdmins({});
    const rows = Object.fromEntries((await db.select().from(users)).map((u) => [u.id, u]));
    expect(rows[ids.owner]).toMatchObject({ role: 'owner', banned: true });
    expect(rows[ids.editor]!.role).toBe('owner');
    expect((await verifyAdminMigration()).ok).toBe(true);
  });

  it('verify fails when the only owners are banned', async () => {
    await seedAdmins();
    await migrateAdmins({});
    await db.update(users).set({ banned: true }).where(eq(users.role, 'owner'));
    await db.update(adminUsers).set({ isActive: false }).where(eq(adminUsers.id, ids.owner));
    await db.delete(adminUsers).where(eq(adminUsers.id, ids.editor));
    const result = await verifyAdminMigration();
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toContain('no active owner');
  });

  it('warns about a skipped admin, remaps its quotes, and verify flags orphans', async () => {
    await seedAdmins();
    await db
      .insert(users)
      .values({ id: 'existing-user', name: 'Existing', email: 'editor@legacy.test', role: 'editor' });
    const [q] = await db
      .insert(quoteRequests)
      .values({ name: 'Q', email: 'q@x.test', phone: '1', assignedAdminId: ids.editor })
      .returning();

    const dry = await migrateAdmins({ dryRun: true });
    expect(dry.warnings.join('\n')).toContain('editor@legacy.test');

    const result = await migrateAdmins({});
    expect(result.warnings).toHaveLength(1);
    const [row] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, q!.id));
    expect(row!.assignedUserId).toBe('existing-user');
    expect((await verifyAdminMigration()).ok).toBe(true);

    await db.update(quoteRequests).set({ assignedUserId: null }).where(eq(quoteRequests.id, q!.id));
    const bad = await verifyAdminMigration();
    expect(bad.ok).toBe(false);
    expect(bad.problems.join('\n')).toContain('no assigned_user_id');
  });
});

describe('demo users in production', () => {
  it('refuses even with SEED_DEMO_USERS=true', async () => {
    const env = process.env as Record<string, string | undefined>;
    const prev = env.NODE_ENV;
    env.NODE_ENV = 'production';
    process.env.SEED_DEMO_USERS = 'true';
    try {
      await expect(seedDemoUsers()).rejects.toThrow(/production/);
    } finally {
      env.NODE_ENV = prev;
      delete process.env.SEED_DEMO_USERS;
    }
  });
});
