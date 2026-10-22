import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { getAuth, resetAuthForTests } from '@/server/lib/auth';
import { captureAuthLinks } from '@/server/lib/auth/email';

import { createTestUser, PASSWORD } from '../support/session';

const NEW_PASSWORD = 'A-brand-new-passphrase-2026';

// The reset-password screen drives this exact sequence through the Better Auth client:
// request a link (no SMTP, so it is captured), follow it, set a password, sign in.
describe('reset-password token flow', () => {
  beforeEach(async () => {
    resetAuthForTests();
    await db.execute(sql`truncate table audit_logs, users cascade`);
  });
  afterEach(async () => {
    await db.execute(sql`truncate table audit_logs, users cascade`);
  });

  it('requests a reset (manual link), resets with the token, then signs in with the new password only', async () => {
    const { email } = await createTestUser('editor');
    const auth = getAuth();

    const { links } = await captureAuthLinks(() =>
      auth.api.requestPasswordReset({ body: { email, redirectTo: 'http://localhost:3000/reset-password' } }),
    );
    expect(links).toHaveLength(1);

    // The emailed URL is `<base>/reset-password/<token>?callbackURL=...`; the token is the last path segment.
    const token = new URL(links[0]).pathname.split('/').pop()!;
    expect(token).toBeTruthy();

    await auth.api.resetPassword({ body: { newPassword: NEW_PASSWORD, token } });

    await expect(auth.api.signInEmail({ body: { email, password: PASSWORD } })).rejects.toMatchObject({
      status: 'UNAUTHORIZED',
    });
    const { user } = await auth.api.signInEmail({ body: { email, password: NEW_PASSWORD } });
    expect(user.email).toBe(email);

    // A used token cannot be replayed.
    await expect(
      auth.api.resetPassword({ body: { newPassword: 'Another-passphrase-2026', token } }),
    ).rejects.toBeTruthy();
  });

  it('answers a reset request for an unknown email without capturing a link', async () => {
    const { links } = await captureAuthLinks(() =>
      getAuth().api.requestPasswordReset({
        body: { email: 'nobody@session.test', redirectTo: 'http://localhost:3000/reset-password' },
      }),
    );
    expect(links).toEqual([]);
  });
});
