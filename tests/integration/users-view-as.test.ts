import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, sessions, users } from '@/server/db/schema';

import { applyCookies, authCall, call, createTestUser, signInCookie, type TestUser } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

type Me = { data: { user: { email: string }; impersonatedBy: string | null }; error: { code: string } };
const me = async (cookie: string) => (await (await call('/auth/me', cookie)).json()) as Me;
const start = (cookie: string, id: string) => call(`/admin/users/${id}/impersonate`, cookie, { method: 'POST' });
const viewAsSessions = async () => (await db.select().from(sessions)).filter((s) => s.impersonatedBy);

async function actor(role: string): Promise<TestUser & { cookie: string }> {
  const user = await createTestUser(role);
  return { ...user, cookie: await signInCookie(user.email) };
}
const viewingAs = async (who: { cookie: string }, targetId: string) =>
  applyCookies(who.cookie, (await start(who.cookie, targetId)).headers.getSetCookie());

beforeEach(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});
afterAll(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});

describe('POST /admin/users/:id/impersonate', () => {
  it('lets an owner view as an editor for at most an hour, audited; writes are refused', async () => {
    const owner = await actor('owner');
    const editor = await createTestUser('editor');

    const res = await start(owner.cookie, editor.id);
    expect(res.status).toBe(200);
    const viewing = applyCookies(owner.cookie, res.headers.getSetCookie());

    const who = await me(viewing);
    expect(who.data.user.email).toBe(editor.email);
    expect(who.data.impersonatedBy).toBe(owner.id);
    // What an editor sees: no user management.
    expect((await call('/admin/users', viewing)).status).toBe(403);
    const [row] = await db.select().from(sessions).where(eq(sessions.userId, editor.id));
    expect(row!.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(3600_000);
    const audits = await db.select().from(auditLogs).where(eq(auditLogs.action, 'auth.impersonate'));
    expect(audits).toHaveLength(1);
    expect(audits[0]!.entityId).toBe(editor.id);
  });

  it('an admin cannot view as an owner or another admin; an owner can view as an admin', async () => {
    const admin = await actor('admin');
    const owner = await createTestUser('owner');
    const other = await createTestUser('admin');
    expect((await start(admin.cookie, owner.id)).status).toBe(403);
    expect((await start(admin.cookie, other.id)).status).toBe(403);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'auth.impersonate'))).toHaveLength(0);

    const ownerSession = await actor('owner');
    expect((await start(ownerSession.cookie, other.id)).status).toBe(200);
  });

  it('refuses yourself (403) and a banned person (409)', async () => {
    const owner = await actor('owner');
    const banned = await createTestUser('editor');
    await db.update(users).set({ banned: true }).where(eq(users.id, banned.id));
    expect((await start(owner.cookie, owner.id)).status).toBe(403);
    expect((await start(owner.cookie, banned.id)).status).toBe(409);
  });

  it('refuses while already viewing as someone', async () => {
    const owner = await actor('owner');
    const a = await createTestUser('admin');
    const b = await createTestUser('editor');
    const viewing = await viewingAs(owner, a.id);
    const again = await start(viewing, b.id);
    expect(again.status).toBe(403);
    expect(((await again.json()) as Me).error.code).toBe('IMPERSONATION_READ_ONLY');
  });

  it('stopping restores the actor and audits it', async () => {
    const owner = await actor('owner');
    const editor = await createTestUser('editor');
    const viewing = await viewingAs(owner, editor.id);
    expect(viewing).toMatch(/dont_remember=/);

    const stop = await authCall('/admin/stop-impersonating', viewing, {});
    expect(stop.status).toBe(200);
    expect(JSON.stringify(await stop.json())).not.toMatch(/"token"/);
    const back = applyCookies(viewing, stop.headers.getSetCookie());
    expect((await me(back)).data.user.email).toBe(owner.email);
    expect(back).not.toMatch(/dont_remember=/);
    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'auth.stop_impersonate'));
    expect(row).toMatchObject({ entityId: editor.id, actorId: owner.id });
  });

  it('View-as survives a session refresh on the same response', async () => {
    const owner = await actor('owner');
    const editor = await createTestUser('editor');
    // Due for Better Auth's daily refresh (expiresIn 7d, updateAge 1d).
    await db.update(sessions).set({ expiresAt: new Date(Date.now() + 5 * 86_400_000) });
    const viewing = await viewingAs(owner, editor.id);
    expect((await me(viewing)).data.user.email).toBe(editor.email);
  });

  it('ends a View-as session after an hour even without dont_remember', async () => {
    const owner = await actor('owner');
    const editor = await createTestUser('editor');
    const viewing = (await viewingAs(owner, editor.id))
      .split('; ')
      .filter((pair) => !pair.includes('dont_remember='))
      .join('; ');
    // Without the cookie Better Auth's rolling refresh stretches the session.
    expect((await me(viewing)).data.user.email).toBe(editor.email);
    const [row] = await db.select().from(sessions).where(eq(sessions.userId, editor.id));
    expect(row!.expiresAt.getTime() - Date.now()).toBeGreaterThan(3600_000);

    await db
      .update(sessions)
      .set({ createdAt: new Date(Date.now() - 3601_000) })
      .where(eq(sessions.id, row!.id));

    expect((await call('/auth/me', viewing)).status).toBe(401);
    expect(await db.select().from(sessions).where(eq(sessions.id, row!.id))).toHaveLength(0);
    const audits = await db.select().from(auditLogs).where(eq(auditLogs.action, 'user.view_as_expired'));
    expect(audits).toHaveLength(1);
    expect(audits[0]!.entityId).toBe(editor.id);
  });
});

// Rights are re-checked after a View-as starts.
describe('View-as after a change of rights', () => {
  async function setUp() {
    const owner = await actor('owner');
    const admin = await actor('admin');
    const editor = await createTestUser('editor');
    const viewing = await viewingAs(admin, editor.id);
    expect((await call('/auth/me', viewing)).status).toBe(200);
    return { owner, admin, editor, viewing };
  }
  const setRoles = (cookie: string, id: string, roles: string[]) =>
    call(`/admin/users/${id}/role`, cookie, { method: 'PATCH', body: { roles } });

  it('demoting the viewer ends the View-as session they started', async () => {
    const { owner, admin, viewing } = await setUp();
    expect((await setRoles(owner.cookie, admin.id, ['viewer'])).status).toBe(200);
    expect(await viewAsSessions()).toHaveLength(0);
    expect((await call('/auth/me', viewing)).status).toBe(401);
  });

  it('promoting the person being viewed to owner ends the View-as session', async () => {
    const { owner, editor, viewing } = await setUp();
    expect((await setRoles(owner.cookie, editor.id, ['owner'])).status).toBe(200);
    expect(await viewAsSessions()).toHaveLength(0);
    expect((await call('/auth/me', viewing)).status).toBe(401);
  });

  // Defence in depth: changes written outside the service still end the view.
  it.each([
    ['the viewer loses the right to view as', { role: 'viewer' }, 'admin'],
    ['the viewer is banned', { banned: true }, 'admin'],
    ['the person viewed now holds admin', { role: 'admin' }, 'editor'],
  ] as const)('a session check refuses View-as when %s', async (_label, change, who) => {
    const { admin, editor, viewing } = await setUp();
    await db
      .update(users)
      .set(change)
      .where(eq(users.id, who === 'admin' ? admin.id : editor.id));
    expect((await call('/auth/me', viewing)).status).toBe(401);
    expect(await viewAsSessions()).toHaveLength(0);
    if (!('banned' in change)) expect((await call('/auth/me', admin.cookie)).status).toBe(200);
  });

  it('normal sessions are unaffected by the check', async () => {
    const { admin, editor, viewing } = await setUp();
    expect((await call('/auth/me', await signInCookie(editor.email))).status).toBe(200);
    expect((await call('/auth/me', admin.cookie)).status).toBe(200);
    expect((await call('/auth/me', viewing)).status).toBe(200);
  });
});
