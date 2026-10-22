import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { accounts, auditLogs, users } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import { getAuth, resetAuthForTests } from '@/server/lib/auth';
import { getFreshSession } from '@/server/lib/auth/fresh-session';
import { hashIp } from '@/server/lib/crypto';

const EMAIL = 'auth-test@example.com';
const PASSWORD = 'Correct-horse-1';

const cookieHeader = (setCookies: string[]) =>
  new Headers({ cookie: setCookies.map((c) => c.split(';')[0]).join('; ') });

async function signIn(email = EMAIL, password = PASSWORD) {
  return getAuth().api.signInEmail({ body: { email, password }, returnHeaders: true });
}

describe('Better Auth server', () => {
  beforeEach(async () => {
    resetAuthForTests();
    await db.execute(sql`truncate table audit_logs, users cascade`);
  });
  afterEach(async () => {
    await db.execute(sql`truncate table audit_logs, users cascade`);
  });

  it('creates a customer via createUser and signs in', async () => {
    const created = await getAuth().api.createUser({
      body: { email: EMAIL, password: PASSWORD, name: 'Test', role: 'user' as never },
    });
    expect(created.user.role).toBe('user');
    const { response } = await signIn();
    expect(response.user.email).toBe(EMAIL);
    expect(response.token).toBeTruthy();
  });

  it('signs in a legacy bcrypt credential and rejects a wrong password', async () => {
    await db.insert(users).values({ id: 'u_bcrypt', name: 'Legacy', email: EMAIL, role: 'editor' });
    await db.insert(accounts).values({
      id: 'a_bcrypt',
      userId: 'u_bcrypt',
      accountId: 'u_bcrypt',
      providerId: 'credential',
      password: bcrypt.hashSync(PASSWORD, 12),
    });
    const { response } = await signIn();
    expect(response.user.id).toBe('u_bcrypt');
    await expect(signIn(EMAIL, 'Wrong-password-1')).rejects.toMatchObject({ status: 'UNAUTHORIZED' });
  });

  it('writes an auth.sign_in audit row with a hashed ip', async () => {
    await getAuth().api.createUser({
      body: { email: EMAIL, password: PASSWORD, name: 'Test', role: 'editor' as never },
    });
    await signIn();
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.action, 'auth.sign_in'));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.actorEmail).toBe(EMAIL);
  });

  it('treats a banned user as anonymous in getFreshSession', async () => {
    const created = await getAuth().api.createUser({
      body: { email: EMAIL, password: PASSWORD, name: 'Test', role: 'editor' as never },
    });
    const { headers } = await signIn();
    const reqHeaders = cookieHeader(headers.getSetCookie());
    expect((await getFreshSession(reqHeaders)).session?.user.id).toBe(created.user.id);
    await db.update(users).set({ banned: true }).where(eq(users.id, created.user.id));
    expect((await getFreshSession(reqHeaders)).session).toBeNull();
  });

  it('removes the session token from JSON sent over HTTP', async () => {
    await getAuth().api.createUser({
      body: { email: EMAIL, password: PASSWORD, name: 'Test', role: 'editor' as never },
    });
    const response = await getAuth().handler(
      new Request('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().length).toBeGreaterThan(0);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty('token');
  });

  it('refuses the admin plugin endpoints over HTTP', async () => {
    const response = await getAuth().handler(
      new Request('http://localhost:3000/api/auth/admin/list-users', {
        headers: { origin: 'http://localhost:3000' },
      }),
    );
    expect(response.status).toBe(403);
  });
});

describe('audit()', () => {
  afterEach(async () => {
    await db.execute(sql`truncate table audit_logs, users cascade`);
  });

  it('stores a hashed ip (never the raw one) and the diff', async () => {
    await audit(
      { userId: null as never, email: 'a@b.test', ip: '203.0.113.7', userAgent: 'UA' },
      {
        action: 'thing.update',
        entityType: 'thing',
        entityId: '1',
        summary: 'Changed',
        diff: { title: { from: 'a', to: 'b' } },
      },
    );
    const [row] = await db.select().from(auditLogs);
    expect(row!.ipHash).toBe(hashIp('203.0.113.7'));
    expect(JSON.stringify(row)).not.toContain('203.0.113.7');
    expect(row!.diff).toEqual({ title: { from: 'a', to: 'b' } });
    expect(row!.userAgent).toBe('UA');
  });
});
