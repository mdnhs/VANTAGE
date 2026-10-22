import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { auditLogs, sessions, users } from '@/server/db/schema';

import { call, createTestUser, sessionCookie, signInCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

type Body = {
  success: boolean;
  data: Record<string, unknown> & {
    id: string;
    roles: string[];
    manualLink?: string;
    revoked?: number;
    email: string;
  };
  pagination?: { total: number };
  error: { code: string; causes?: Record<string, string[]> };
};
type ListBody = { data: Array<Record<string, unknown> & { email: string }>; pagination: { total: number } };

const json = async (r: Response) => (await r.json()) as Body;
const roleOf = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0]?.role;
const audited = (action: string) => db.select().from(auditLogs).where(eq(auditLogs.action, action));
const sessionsOf = (userId: string) => db.select().from(sessions).where(eq(sessions.userId, userId));
const idOf = async (email: string) => (await db.select().from(users).where(eq(users.email, email)))[0]!.id;
const post = (path: string, cookie: string, body?: unknown) => call(path, cookie, { method: 'POST', body });

async function actor(role: RoleName) {
  const user = await createTestUser(role);
  return { ...user, cookie: await signInCookie(user.email) };
}

beforeEach(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});
afterAll(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});

describe('access', () => {
  it.each(ROLE_NAMES)('GET /admin/users as %s', async (role) => {
    const res = await call('/admin/users', await sessionCookie(role));
    expect(res.status).toBe(role === 'owner' || role === 'admin' ? 200 : 403);
  });

  it('refuses a customer session (403) and no session (401)', async () => {
    expect((await call('/admin/users', await sessionCookie('user'))).status).toBe(403);
    expect((await call('/admin/users')).status).toBe(401);
  });

  it('a viewer gets 403 on every user-management write, with no side effect', async () => {
    const viewer = await actor('viewer');
    const target = await createTestUser('editor');
    const writes: Array<[string, string, unknown?]> = [
      ['POST', '/admin/users/invite', { email: 'x@example.com', name: 'X', role: 'viewer' }],
      ['PATCH', `/admin/users/${target.id}/role`, { roles: ['admin'] }],
      ['POST', `/admin/users/${target.id}/ban`, {}],
      ['POST', `/admin/users/${target.id}/unban`],
      ['DELETE', `/admin/users/${target.id}/sessions`],
      ['POST', `/admin/users/${target.id}/resend-invite`],
      ['POST', `/admin/users/${target.id}/impersonate`],
      ['DELETE', `/admin/users/${target.id}`],
    ];
    for (const [method, path, body] of writes) {
      const res = await call(path, viewer.cookie, { method, body });
      expect(res.status, `${method} ${path}`).toBe(403);
      expect((await json(res)).error.code).toBe('FORBIDDEN');
    }
    expect(await roleOf(target.id)).toBe('editor');
    expect(await db.select().from(users).where(eq(users.id, target.id))).toHaveLength(1);
    expect((await audited('user.invite')).length).toBe(0);
  });

  it('has no author-link route (author is not a VANTAGE concept)', async () => {
    const owner = await actor('owner');
    const res = await call(`/admin/users/${owner.id}/author`, owner.cookie, {
      method: 'PUT',
      body: { authorId: null },
    });
    expect(res.status).toBe(404);
  });
});

describe('GET /admin/users', () => {
  it('lists roles, 2FA, invite state, activity and nothing secret', async () => {
    const owner = await actor('owner');
    const editor = await createTestUser('editor', 'ed@example.com');
    await signInCookie(editor.email);
    await post('/admin/users/invite', owner.cookie, { email: 'new@example.com', name: 'New', role: 'viewer' });

    const res = await call('/admin/users?pageSize=10', owner.cookie);
    const body = (await res.json()) as ListBody;
    expect(body.pagination.total).toBe(3);
    const ed = body.data.find((u) => u.email === 'ed@example.com')!;
    expect(ed).toMatchObject({ roles: ['editor'], twoFactorEnabled: false, banned: false, invitePending: false });
    expect(Date.parse(ed.lastActiveAt as string)).toBeGreaterThan(Date.now() - 60_000);
    const invited = body.data.find((u) => u.email === 'new@example.com')!;
    expect(invited).toMatchObject({ invitePending: true, lastActiveAt: null });
    expect(Object.keys(ed).sort()).toEqual(
      [
        'banExpires',
        'banReason',
        'banned',
        'createdAt',
        'email',
        'id',
        'invitePending',
        'lastActiveAt',
        'name',
        'roles',
        'twoFactorEnabled',
      ].sort(),
    );
  });

  it('filters by search, role and status', async () => {
    const owner = await actor('owner');
    await createTestUser('editor', 'zed@example.com');
    const v = await createTestUser('viewer', 'vee@example.com');
    await db.update(users).set({ banned: true }).where(eq(users.id, v.id));
    const emails = async (qs: string) =>
      ((await (await call(`/admin/users?${qs}`, owner.cookie)).json()) as ListBody).data.map((u) => u.email);

    expect(await emails('q=ZED')).toEqual(['zed@example.com']);
    expect(await emails('role=viewer')).toEqual(['vee@example.com']);
    expect(await emails('status=banned')).toEqual(['vee@example.com']);
    expect(await emails('q=%25')).toEqual([]);
    expect((await call('/admin/users?role=root', owner.cookie)).status).toBe(422);
  });
});

describe('POST /admin/users/invite', () => {
  const invite = (cookie: string, body: unknown) => post('/admin/users/invite', cookie, body);

  it('creates the account (201), returns manualLink without SMTP and audits user.invite', async () => {
    const owner = await actor('owner');
    const res = await invite(owner.cookie, { email: '  New.Admin@Example.com ', name: 'Nia', role: 'admin' });
    expect(res.status).toBe(201);
    const { data } = await json(res);
    expect(data).toMatchObject({ email: 'new.admin@example.com', role: 'admin' });
    expect(data.manualLink).toMatch(/reset-password/);
    const [row] = await audited('user.invite');
    expect(row).toMatchObject({ entityId: data.id, actorId: owner.id });
    // The link carries the token: never in the audit trail.
    expect(JSON.stringify(row)).not.toContain(data.manualLink!);
  });

  it('does not let an admin invite an owner, but lets an owner', async () => {
    const admin = await actor('admin');
    const res = await invite(admin.cookie, { email: 'x@example.com', name: 'X', role: 'owner' });
    expect(res.status).toBe(403);
    expect(await db.select().from(users).where(eq(users.email, 'x@example.com'))).toHaveLength(0);
    const owner = await actor('owner');
    expect((await invite(owner.cookie, { email: 'o2@example.com', name: 'O', role: 'owner' })).status).toBe(201);
  });

  it.each(['editor,owner', ' editor', 'editor ', 'Editor', 'root', ''])('rejects role %j (422)', async (role) => {
    const owner = await actor('owner');
    const res = await invite(owner.cookie, { email: 'x@example.com', name: 'X', role });
    expect(res.status).toBe(422);
    expect((await json(res)).error.code).toBe('VALIDATION_ERROR');
    expect(await db.select().from(users).where(eq(users.email, 'x@example.com'))).toHaveLength(0);
  });

  it('returns field errors for invalid input', async () => {
    const owner = await actor('owner');
    const res = await invite(owner.cookie, { email: 'nope', name: '', role: 'chief' });
    expect(res.status).toBe(422);
    expect(Object.keys((await json(res)).error.causes!).sort()).toEqual(['email', 'name', 'role']);
  });

  it('treats emails case-insensitively for duplicates (409)', async () => {
    const owner = await actor('owner');
    await createTestUser('editor', 'editor@example.com');
    const res = await invite(owner.cookie, { email: 'Editor@Example.com', name: 'Dup', role: 'viewer' });
    expect(res.status).toBe(409);
  });
});

describe('POST /admin/users/:id/resend-invite', () => {
  it('returns a manualLink for a pending invite and refuses once a password is set', async () => {
    const owner = await actor('owner');
    const { data: invited } = await json(
      await post('/admin/users/invite', owner.cookie, { email: 'new@example.com', name: 'New', role: 'viewer' }),
    );
    const again = await post(`/admin/users/${invited.id}/resend-invite`, owner.cookie);
    expect(again.status).toBe(200);
    expect((await json(again)).data.manualLink).toMatch(/reset-password/);
    expect(await audited('user.invite_resend')).toHaveLength(1);

    const active = await createTestUser('editor');
    expect((await post(`/admin/users/${active.id}/resend-invite`, owner.cookie)).status).toBe(409);
  });
});

describe('PATCH /admin/users/:id/role', () => {
  const setRoles = (cookie: string, id: string, roles: unknown) =>
    call(`/admin/users/${id}/role`, cookie, { method: 'PATCH', body: { roles } });

  it('stores several roles canonically (ROLE_NAMES order, comma-joined) and audits', async () => {
    const admin = await actor('admin');
    const target = await createTestUser('viewer');
    const res = await setRoles(admin.cookie, target.id, ['marketer', 'editor']);
    expect(res.status).toBe(200);
    expect((await json(res)).data.roles).toEqual(['editor', 'marketer']);
    expect(await roleOf(target.id)).toBe('editor,marketer');
    const [row] = await audited('user.role');
    expect(row).toMatchObject({ entityId: target.id, diff: { role: { from: 'viewer', to: 'editor,marketer' } } });
  });

  it('revokes the target sessions on a role change (next request 401)', async () => {
    const owner = await actor('owner');
    const target = await createTestUser('editor');
    const device = await signInCookie(target.email);
    expect((await call('/auth/me', device)).status).toBe(200);
    expect((await setRoles(owner.cookie, target.id, ['viewer'])).status).toBe(200);
    expect(await sessionsOf(target.id)).toHaveLength(0);
    expect((await call('/auth/me', device)).status).toBe(401);
  });

  it('an unchanged role revokes nothing', async () => {
    const owner = await actor('owner');
    const target = await createTestUser('editor');
    const device = await signInCookie(target.email);
    expect((await setRoles(owner.cookie, target.id, ['editor'])).status).toBe(200);
    expect((await call('/auth/me', device)).status).toBe(200);
  });

  it('never lets an admin change an owner or grant owner', async () => {
    const admin = await actor('admin');
    const owner = await createTestUser('owner');
    const editor = await createTestUser('editor');
    expect((await setRoles(admin.cookie, owner.id, ['viewer'])).status).toBe(403);
    expect((await setRoles(admin.cookie, editor.id, ['owner'])).status).toBe(403);
    expect(await roleOf(owner.id)).toBe('owner');
    expect(await roleOf(editor.id)).toBe('editor');
  });

  it('lets an owner promote and demote another owner', async () => {
    const owner = await actor('owner');
    const other = await createTestUser('editor');
    expect((await setRoles(owner.cookie, other.id, ['owner'])).status).toBe(200);
    expect((await setRoles(owner.cookie, other.id, ['admin'])).status).toBe(200);
    expect(await roleOf(other.id)).toBe('admin');
  });

  it('refuses your own role (403) and 404s an unknown person', async () => {
    const owner = await actor('owner');
    expect((await setRoles(owner.cookie, owner.id, ['admin'])).status).toBe(403);
    expect((await setRoles(owner.cookie, 'no-such-user', ['editor'])).status).toBe(404);
  });

  it.each([
    ['unknown', ['root']],
    ['padded', [' editor']],
    ['upper case', ['Editor']],
    ['duplicates', ['editor', 'editor']],
    ['empty', []],
    ['comma-joined', ['editor,owner']],
    ['the customer role', ['user']],
  ])('rejects %s roles (422)', async (_label, roles) => {
    const owner = await actor('owner');
    const target = await createTestUser('viewer');
    const res = await setRoles(owner.cookie, target.id, roles);
    expect(res.status).toBe(422);
    expect(await roleOf(target.id)).toBe('viewer');
  });

  it('two owners demoting each other at once leave one owner', async () => {
    const a = await actor('owner');
    const b = await actor('owner');
    const [ra, rb] = await Promise.all([setRoles(a.cookie, b.id, ['admin']), setRoles(b.cookie, a.id, ['admin'])]);
    expect([ra.status, rb.status].filter((s) => s === 200)).toHaveLength(1);
    const owners = (await db.select().from(users)).filter((u) => u.role.split(',').includes('owner'));
    expect(owners).toHaveLength(1);
  });
});

describe('ban and unban', () => {
  it('signs the person out everywhere, View-as sessions included; next request 401', async () => {
    const owner = await actor('owner');
    const target = await actor('admin');
    const second = await signInCookie(target.email);
    const editor = await createTestUser('editor');
    const viewing = await viewAsCookie(target.cookie, editor.id);

    const res = await post(`/admin/users/${target.id}/ban`, owner.cookie, { reason: 'Left the practice', days: 30 });
    expect(res.status).toBe(200);
    expect((await json(res)).data).toMatchObject({ banned: true, banReason: 'Left the practice' });
    for (const c of [target.cookie, second, viewing]) expect((await call('/auth/me', c)).status).toBe(401);
    expect(await sessionsOf(target.id)).toHaveLength(0);
    expect(await audited('user.ban')).toHaveLength(1);
  });

  it("a banned person's surviving session is refused on the next request", async () => {
    const target = await actor('editor');
    expect((await call('/auth/me', target.cookie)).status).toBe(200);
    await db.update(users).set({ banned: true }).where(eq(users.id, target.id));
    expect(await sessionsOf(target.id)).toHaveLength(1);
    expect((await call('/auth/me', target.cookie)).status).toBe(401);
  });

  it('an expired ban no longer blocks', async () => {
    const owner = await actor('owner');
    const target = await createTestUser('editor');
    await post(`/admin/users/${target.id}/ban`, owner.cookie, { days: 1 });
    await db
      .update(users)
      .set({ banExpires: new Date(Date.now() - 1000) })
      .where(eq(users.id, target.id));
    // Better Auth lifts an expired ban while signing in.
    const fresh = await signInCookie(target.email);
    expect((await call('/auth/me', fresh)).status).toBe(200);
  });

  it('unban clears the ban and is audited', async () => {
    const admin = await actor('admin');
    const target = await createTestUser('editor');
    await post(`/admin/users/${target.id}/ban`, admin.cookie, {});
    const res = await post(`/admin/users/${target.id}/unban`, admin.cookie);
    expect((await json(res)).data).toMatchObject({ banned: false, banReason: null, banExpires: null });
    expect(await audited('user.unban')).toHaveLength(1);
  });

  it('an admin cannot ban an owner; nobody bans themselves', async () => {
    const admin = await actor('admin');
    const owner = await createTestUser('owner');
    expect((await post(`/admin/users/${owner.id}/ban`, admin.cookie, {})).status).toBe(403);
    expect((await post(`/admin/users/${admin.id}/ban`, admin.cookie, {})).status).toBe(403);
  });

  it('two owners banning each other at once leave one owner', async () => {
    const a = await actor('owner');
    const b = await actor('owner');
    const [ra, rb] = await Promise.all([
      post(`/admin/users/${b.id}/ban`, a.cookie, {}),
      post(`/admin/users/${a.id}/ban`, b.cookie, {}),
    ]);
    expect([ra.status, rb.status].filter((s) => s === 200)).toHaveLength(1);
    expect((await db.select().from(users)).filter((u) => !u.banned)).toHaveLength(1);
  });
});

describe('DELETE /admin/users/:id/sessions', () => {
  it('signs every device out and reports the count', async () => {
    const admin = await actor('admin');
    const target = await createTestUser('editor');
    const one = await signInCookie(target.email);
    const two = await signInCookie(target.email);
    const res = await call(`/admin/users/${target.id}/sessions`, admin.cookie, { method: 'DELETE' });
    expect((await json(res)).data).toEqual({ revoked: 2 });
    for (const c of [one, two]) expect((await call('/auth/me', c)).status).toBe(401);
    expect(await audited('user.sessions_revoke')).toHaveLength(1);
  });
});

describe('DELETE /admin/users/:id', () => {
  it('deletes a person; their audit rows keep the email', async () => {
    const owner = await actor('owner');
    const target = await createTestUser('editor', 'ed@example.com');
    const device = await signInCookie(target.email);
    const res = await call(`/admin/users/${target.id}`, owner.cookie, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect((await call('/auth/me', device)).status).toBe(401);
    expect(await db.select().from(users).where(eq(users.id, target.id))).toHaveLength(0);
    const [del] = await audited('user.delete');
    expect(del).toMatchObject({ entityId: target.id, summary: 'Deleted ed@example.com' });
  });

  it('an admin cannot delete an owner; nobody deletes themselves', async () => {
    const admin = await actor('admin');
    const owner = await createTestUser('owner');
    expect((await call(`/admin/users/${owner.id}`, admin.cookie, { method: 'DELETE' })).status).toBe(403);
    expect((await call(`/admin/users/${admin.id}`, admin.cookie, { method: 'DELETE' })).status).toBe(403);
  });
});

describe('last owner', () => {
  // The self rule means an active owner always remains while one acts, so the
  // 409 is defence in depth. A legacy padded role (' owner') still parses as
  // owner for the acting user but is invisible to the SQL count, which proves
  // the guard fires and why roles must be written canonically.
  it.each([
    [
      'demote',
      (c: string, id: string) => call(`/admin/users/${id}/role`, c, { method: 'PATCH', body: { roles: ['admin'] } }),
    ],
    ['ban', (c: string, id: string) => post(`/admin/users/${id}/ban`, c, {})],
    ['delete', (c: string, id: string) => call(`/admin/users/${id}`, c, { method: 'DELETE' })],
  ])('refuses to %s the last owner with 409 LAST_OWNER', async (_label, act) => {
    const actorUser = await actor('owner');
    const target = await createTestUser('owner');
    await db.update(users).set({ role: 'owner ' }).where(eq(users.id, actorUser.id));
    const res = await act(actorUser.cookie, target.id);
    expect(res.status).toBe(409);
    expect((await json(res)).error.code).toBe('LAST_OWNER');
    expect(await roleOf(target.id)).toBe('owner');
    expect(await db.select().from(users).where(eq(users.id, target.id))).toHaveLength(1);
  });
});

describe('View-as sessions', () => {
  it('user management refuses a View-as session with IMPERSONATION_READ_ONLY', async () => {
    const owner = await actor('owner');
    const admin = await createTestUser('admin');
    const target = await createTestUser('viewer');
    const viewing = await viewAsCookie(owner.cookie, admin.id);
    const writes: Array<[string, string, unknown?]> = [
      ['POST', '/admin/users/invite', { email: 'x@example.com', name: 'X', role: 'viewer' }],
      ['PATCH', `/admin/users/${target.id}/role`, { roles: ['editor'] }],
      ['POST', `/admin/users/${target.id}/ban`, {}],
      ['POST', `/admin/users/${target.id}/unban`],
      ['DELETE', `/admin/users/${target.id}/sessions`],
      ['POST', `/admin/users/${target.id}/resend-invite`],
      ['DELETE', `/admin/users/${target.id}`],
    ];
    for (const [method, path, body] of writes) {
      const res = await call(path, viewing, { method, body });
      expect(res.status, `${method} ${path}`).toBe(403);
      expect((await json(res)).error.code, `${method} ${path}`).toBe('IMPERSONATION_READ_ONLY');
    }
    expect(await roleOf(target.id)).toBe('viewer');
    expect(await idOf(target.email)).toBe(target.id);
  });
});
