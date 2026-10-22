import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';

import { getAuth } from './auth';
import { captureAuthLinks } from './email';

// The first owner, created from the command line (MK bootstrap). Invited like
// any user: no password, a set-password link goes out by email, or comes back
// as `manualLink` when SMTP is not configured.
export async function createOwner({ email, name }: { email: string; name: string }): Promise<{ manualLink?: string }> {
  const normalised = email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalised));
  if (existing) throw new Error('Someone with that email already has an account');

  const auth = getAuth();
  const { user } = await auth.api.createUser({ body: { email: normalised, name, role: 'owner' } });

  const appUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectTo = new URL('/dashboard/reset-password?invite=1', appUrl).toString();
  const { links } = await captureAuthLinks(() =>
    auth.api.requestPasswordReset({ body: { email: normalised, redirectTo } }),
  );

  // The owner exists already; a failed audit row must not make reruns impossible.
  try {
    await audit(null, {
      action: 'user.bootstrap-owner',
      entityType: 'user',
      entityId: user.id,
      summary: `Bootstrapped owner ${user.email} from the CLI`,
    });
  } catch (error) {
    console.warn('owner created, but the audit entry failed:', error instanceof Error ? error.message : 'unknown');
  }
  return links[0] ? { manualLink: links[0] } : {};
}
