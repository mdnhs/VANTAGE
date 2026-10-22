import 'server-only';

import { APIError } from 'better-auth/api';
import { eq } from 'drizzle-orm';

import type { RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';

import { getAuth } from './auth';
import { captureAuthLinks } from './email';

const DUPLICATE_MESSAGE = 'Someone with that email already has an account';

export class DuplicateUserError extends Error {
  constructor() {
    super(DUPLICATE_MESSAGE);
    this.name = 'DuplicateUserError';
  }
}

// A concurrent invite can slip past the pre-check: Better Auth reports the
// duplicate as an APIError, Postgres as a unique violation (23505).
export function isDuplicateUserError(error: unknown): boolean {
  if (error instanceof DuplicateUserError) return true;
  if (error instanceof APIError) {
    const code = (error.body as { code?: string } | undefined)?.code;
    return typeof code === 'string' && code.startsWith('USER_ALREADY_EXISTS');
  }
  for (let e: unknown = error, i = 0; e && i < 5; i++, e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === '23505') return true;
  }
  return false;
}

export type ProvisionInput = { email: string; name: string; role: RoleName };
// `headers` carries the acting user's request so Better Auth applies RBAC;
// `system` skips that check and is for trusted server code (CLI bootstrap) only.
export type ProvisionContext = { headers: Headers } | { as: 'system' };

// Creates an account without a password, then sends the reset link as an
// invitation. Without SMTP the link comes back as `manualLink` (never logged).
export async function provisionUser(input: ProvisionInput, context: ProvisionContext) {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) throw new DuplicateUserError();

  const auth = getAuth();
  let user;
  try {
    ({ user } = await auth.api.createUser({
      body: { email, name: input.name, role: input.role },
      headers: 'headers' in context ? context.headers : undefined,
    }));
  } catch (error) {
    if (isDuplicateUserError(error)) throw new DuplicateUserError();
    throw error;
  }

  const appUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectTo = new URL('/reset-password?invite=1', appUrl).toString();
  const { links } = await captureAuthLinks(() => auth.api.requestPasswordReset({ body: { email, redirectTo } }));

  return {
    user: { id: user.id, email: user.email, name: user.name, role: input.role as string },
    ...(links[0] ? { manualLink: links[0] } : {}),
  };
}

// The first owner, created from the command line (MK bootstrap).
export async function createOwner({ email, name }: { email: string; name: string }): Promise<{ manualLink?: string }> {
  const { user, manualLink } = await provisionUser({ email, name, role: 'owner' }, { as: 'system' });

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
  return manualLink ? { manualLink } : {};
}
