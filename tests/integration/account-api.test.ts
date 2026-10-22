import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, sessions } from '@/server/db/schema';

import { call, createTestUser, sessionCookie, signInCookie, viewAsCookie } from '../support/session';

type Body = {
  data: Array<{ id: string; device: string; lastActiveAt: string; current: boolean }> & { revoked?: number };
  error: { code: string };
};

beforeEach(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});
afterAll(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});

describe('account sessions API', () => {
  it('lists own devices, current first, with no token or IP', async () => {
    const user = await createTestUser('editor');
    const laptop = await signInCookie(user.email);
    await signInCookie(user.email);
    const res = await call('/account/sessions', laptop);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Body;
    expect(body.data).toHaveLength(2);
    expect(body.data.filter((d) => d.current)).toHaveLength(1);
    expect(Object.keys(body.data[0]!).sort()).toEqual(['current', 'device', 'id', 'lastActiveAt']);
    expect(body.data[0]!.current).toBe(true);
  });

  it('revokes another device, refuses the current one, and 404s other people', async () => {
    const user = await createTestUser('editor');
    const laptop = await signInCookie(user.email);
    const phone = await signInCookie(user.email);
    const list = (await (await call('/account/sessions', laptop)).json()) as Body;
    const current = list.data.find((d) => d.current)!;
    const other = list.data.find((d) => !d.current)!;

    expect((await call(`/account/sessions/${current.id}`, laptop, { method: 'DELETE' })).status).toBe(400);
    expect((await call(`/account/sessions/${other.id}`, laptop, { method: 'DELETE' })).status).toBe(200);
    expect((await call('/auth/me', phone)).status).toBe(401);
    expect((await call('/auth/me', laptop)).status).toBe(200);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'account.session_revoke'))).toHaveLength(1);

    const stranger = await sessionCookie('editor');
    expect((await call(`/account/sessions/${current.id}`, stranger, { method: 'DELETE' })).status).toBe(404);
    expect((await call('/auth/me', laptop)).status).toBe(200);
  });

  it('revokes all other devices', async () => {
    const user = await createTestUser('author');
    const laptop = await signInCookie(user.email);
    const phone = await signInCookie(user.email);
    const tablet = await signInCookie(user.email);
    const res = await call('/account/sessions/revoke-others', laptop, { method: 'POST' });
    expect(((await res.json()) as Body).data.revoked).toBe(2);
    for (const c of [phone, tablet]) expect((await call('/auth/me', c)).status).toBe(401);
    expect((await call('/auth/me', laptop)).status).toBe(200);
    expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(1);
  });

  it('is available to every admin role, refused to customers and anonymous callers', async () => {
    expect((await call('/account/sessions', await sessionCookie('viewer'))).status).toBe(200);
    expect((await call('/account/sessions', await sessionCookie('user'))).status).toBe(403);
    expect((await call('/account/sessions')).status).toBe(401);
  });

  it('is refused during View-as', async () => {
    const owner = await sessionCookie('owner');
    const editor = await createTestUser('editor');
    const viewing = await viewAsCookie(owner, editor.id);
    for (const [method, path] of [
      ['GET', '/account/sessions'],
      ['POST', '/account/sessions/revoke-others'],
      ['DELETE', '/account/sessions/some-id'],
    ] as const) {
      const res = await call(path, viewing, { method });
      expect(res.status, path).toBe(403);
      expect(((await res.json()) as Body).error.code).toBe('IMPERSONATION_READ_ONLY');
    }
  });
});
