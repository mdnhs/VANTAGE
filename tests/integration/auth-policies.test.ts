import { asc, eq, sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, sessions, twoFactors, users, verifications } from '@/server/db/schema';

import {
  authCall,
  createTestUser,
  PASSWORD,
  sessionCookie,
  signInCookie,
  viewAsCookie,
  type TestUser,
} from '../support/session';

type Json = Record<string, unknown>;
const tokensOf = async (userId: string) =>
  (
    await db
      .select({ token: sessions.token })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(asc(sessions.createdAt))
  ).map((row) => row.token);
const accountRows = async () =>
  (await db.select().from(auditLogs)).filter(
    (row) => !row.action.startsWith('auth.') && row.action.startsWith('account.'),
  );
const nameOf = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0]!;

async function editorOnTwoDevices() {
  const user = await createTestUser('editor');
  const laptop = await signInCookie(user.email);
  const phone = await signInCookie(user.email);
  const [laptopToken] = await tokensOf(user.id);
  return { user, laptop, phone, laptopToken };
}
async function ownerViewingAsEditor() {
  const editor = await createTestUser('editor');
  const owner = await sessionCookie('owner');
  return { editor, cookie: await viewAsCookie(owner, editor.id) };
}

beforeEach(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});
afterAll(async () => {
  await db.execute(sql`truncate table audit_logs, users cascade`);
});

describe('changing a password', () => {
  it('always signs the other devices out, audits it and returns no token', async () => {
    const { user, phone, laptopToken } = await editorOnTwoDevices();
    const res = await authCall('/change-password', phone, {
      currentPassword: PASSWORD,
      newPassword: 'a brand new passphrase',
      revokeOtherSessions: false,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).not.toHaveProperty('token');
    const remaining = await tokensOf(user.id);
    expect(remaining).toHaveLength(1);
    expect(remaining).not.toContain(laptopToken);
    const rows = await accountRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: 'account.password_change', actorId: user.id, entityId: user.id });
  });

  it('audits nothing when the current password is wrong', async () => {
    const { user, phone } = await editorOnTwoDevices();
    const res = await authCall('/change-password', phone, {
      currentPassword: 'not the password at all',
      newPassword: 'a brand new passphrase',
    });
    expect(res.status).toBe(400);
    expect(await tokensOf(user.id)).toHaveLength(2);
    expect(await accountRows()).toEqual([]);
  });

  it('is refused during View-as', async () => {
    const { editor, cookie } = await ownerViewingAsEditor();
    const res = await authCall('/change-password', cookie, {
      currentPassword: PASSWORD,
      newPassword: 'a brand new passphrase',
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'IMPERSONATION_READ_ONLY' });
    expect(await accountRows()).toEqual([]);
    await expect(signInCookie(editor.email)).resolves.toMatch(/vantage\.session_token=/);
  });
});

describe('updating the profile (name only)', () => {
  it('saves a trimmed name and audits the change', async () => {
    const { user, phone } = await editorOnTwoDevices();
    const res = await authCall('/update-user', phone, { name: '  Eddie  ' });
    expect(res.status).toBe(200);
    expect((await nameOf(user.id)).name).toBe('Eddie');
    const rows = await accountRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: 'account.profile_update',
      entityId: user.id,
      diff: { name: { from: 'Test editor', to: 'Eddie' } },
    });
  });

  it.each([
    ['an empty name', { name: '   ' }],
    ['an over-long name', { name: 'x'.repeat(101) }],
    ['an image', { name: 'Ok', image: 'https://example.com/me.png' }],
    ['any other key', { name: 'Ok', role: 'owner' }],
    ['no name', {}],
  ])('refuses %s', async (_label, body) => {
    const { user, phone } = await editorOnTwoDevices();
    const res = await authCall('/update-user', phone, body);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'INVALID_PROFILE' });
    expect(await nameOf(user.id)).toMatchObject({ name: 'Test editor', image: null, role: 'editor' });
    expect(await accountRows()).toEqual([]);
  });

  it('is refused during View-as', async () => {
    const { editor, cookie } = await ownerViewingAsEditor();
    const res = await authCall('/update-user', cookie, { name: 'Hijacked' });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'IMPERSONATION_READ_ONLY' });
    expect((await nameOf(editor.id)).name).toBe('Test editor');
  });
});

describe('two-factor policy', () => {
  it('refuses two-factor changes while viewing as someone', async () => {
    const { cookie } = await ownerViewingAsEditor();
    for (const path of ['/two-factor/enable', '/two-factor/disable', '/two-factor/generate-backup-codes']) {
      const res = await authCall(path, cookie, { password: PASSWORD });
      expect(res.status, path).toBe(403);
      expect(((await res.json()) as Json).code, path).toBe('IMPERSONATION_READ_ONLY');
    }
  });
});

describe('two-factor lockout (matches the LOCKED copy: 10 wrong codes, 15 minutes)', () => {
  it('locks after 10 wrong codes in a row, for ~15 minutes', async () => {
    const user = await createTestUser('editor');
    const cookie = await signInCookie(user.email);
    expect((await authCall('/two-factor/enable', cookie, { password: PASSWORD })).status).toBe(200);
    await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, user.id));
    await db.update(twoFactors).set({ verified: true }).where(eq(twoFactors.userId, user.id));

    // Each sign-in challenge allows 5 tries; the account budget spans challenges.
    const challenge = async () => {
      const signIn = await authCall('/sign-in/email', undefined, { email: user.email, password: PASSWORD });
      expect(await signIn.json()).toMatchObject({ twoFactorRedirect: true });
      return signIn.headers
        .getSetCookie()
        .map((c) => c.split(';')[0])
        .join('; ');
    };
    let current = await challenge();
    for (let i = 1; i <= 10; i++) {
      if (i === 6) current = await challenge();
      const res = await authCall('/two-factor/verify-totp', current, { code: '000000' });
      expect(res.status, `attempt ${i}`).toBe(401);
    }
    const locked = await authCall('/two-factor/verify-totp', await challenge(), { code: '000000' });
    expect(locked.status).toBe(429);
    expect(await locked.json()).toMatchObject({ code: 'ACCOUNT_TEMPORARILY_LOCKED' });

    const [row] = await db.select().from(twoFactors).where(eq(twoFactors.userId, user.id));
    const minutes = (new Date(row!.lockedUntil!).getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(14);
    expect(minutes).toBeLessThanOrEqual(15);
  });
});

describe("Better Auth's own session endpoints", () => {
  it.each([
    ['/list-sessions', undefined],
    ['/revoke-session', { token: 'x' }],
    ['/revoke-sessions', {}],
    ['/revoke-other-sessions', {}],
  ])('refuses %s over HTTP', async (path, body) => {
    const { user, phone } = await editorOnTwoDevices();
    const res = await authCall(path, phone, body);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'SESSION_ENDPOINT_DISABLED' });
    expect(await tokensOf(user.id)).toHaveLength(2);
  });

  it('never returns the session token from get-session', async () => {
    const { phone } = await editorOnTwoDevices();
    const res = await authCall('/get-session', phone);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { session: Json };
    expect(body.session).not.toHaveProperty('token');
  });
});

describe('admin password length (12) vs customer (8)', () => {
  const SHORT = 'Eleven-char'; // 11
  const TWELVE = 'Twelve-chars'; // 12
  const EIGHT = 'Eight-ch'; // 8

  async function resetToken(user: TestUser): Promise<string> {
    const token = `tok-${user.id}`;
    await db.insert(verifications).values({
      id: `v-${user.id}`,
      identifier: `reset-password:${token}`,
      value: user.id,
      expiresAt: new Date(Date.now() + 3600_000),
    });
    return token;
  }

  it.each(['owner', 'admin', 'editor', 'viewer'])('refuses an 11-char reset for %s', async (role) => {
    const user = await createTestUser(role);
    const token = await resetToken(user);
    const res = await authCall('/reset-password', undefined, { newPassword: SHORT, token });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'PASSWORD_TOO_SHORT' });
    await expect(signInCookie(user.email, SHORT)).rejects.toThrow();
  });

  it('accepts a 12-char reset for an admin role', async () => {
    const user = await createTestUser('admin');
    const token = await resetToken(user);
    const res = await authCall('/reset-password', undefined, { newPassword: TWELVE, token });
    expect(res.status).toBe(200);
    await expect(signInCookie(user.email, TWELVE)).resolves.toBeTruthy();
  });

  it('refuses an 11-char change-password for an admin role and keeps the old password', async () => {
    const user = await createTestUser('admin');
    const cookie = await signInCookie(user.email);
    const res = await authCall('/change-password', cookie, { currentPassword: PASSWORD, newPassword: SHORT });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'PASSWORD_TOO_SHORT' });
    await expect(signInCookie(user.email)).resolves.toBeTruthy();
    expect(await accountRows()).toEqual([]);
  });

  it('keeps 8 for the customer role (reset and change)', async () => {
    const customer = await createTestUser('user');
    const token = await resetToken(customer);
    expect((await authCall('/reset-password', undefined, { newPassword: EIGHT, token })).status).toBe(200);
    const cookie = await signInCookie(customer.email, EIGHT);
    const res = await authCall('/change-password', cookie, { currentPassword: EIGHT, newPassword: 'Another-8' });
    expect(res.status).toBe(200);
  });

  it('still enforces the 8-char floor for everyone', async () => {
    const customer = await createTestUser('user');
    const token = await resetToken(customer);
    const res = await authCall('/reset-password', undefined, { newPassword: 'short', token });
    expect(res.status).toBe(400);
  });
});
