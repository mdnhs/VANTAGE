/**
 * Demo users, one per admin role (MK style), for LOCAL / STAGING only.
 *
 *   SEED_DEMO_USERS=true yarn db:seed-demo-users
 *
 * Passwords are fixed test credentials (`Demo-<Role>-2026!`), so this refuses
 * to run unless SEED_DEMO_USERS=true. Never run it against production.
 * Idempotent: users whose email already exists are left untouched.
 */
import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';

import type { RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { accounts, users } from '@/server/db/schema';

export const DEMO_PASSWORD = 'Demo12345678!';

export const DEMO_USERS: { email: string; name: string; role: RoleName; password: string }[] = [
  { email: 'owner@vantage.test', name: 'Olivia Owner', role: 'owner', password: DEMO_PASSWORD },
  { email: 'admin@vantage.test', name: 'Adam Admin', role: 'admin', password: DEMO_PASSWORD },
  { email: 'editor@vantage.test', name: 'Erin Editor', role: 'editor', password: DEMO_PASSWORD },
  { email: 'author@vantage.test', name: 'Aaron Author', role: 'author', password: DEMO_PASSWORD },
  { email: 'marketer@vantage.test', name: 'Maya Marketer', role: 'marketer', password: DEMO_PASSWORD },
  { email: 'intake@vantage.test', name: 'Ian Intake', role: 'intake', password: DEMO_PASSWORD },
  { email: 'viewer@vantage.test', name: 'Vera Viewer', role: 'viewer', password: DEMO_PASSWORD },
];

export async function seedDemoUsers(): Promise<{ created: number; skipped: number }> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo users in production.');
  }
  if (process.env.SEED_DEMO_USERS !== 'true') {
    throw new Error('Refusing to seed demo users: set SEED_DEMO_USERS=true (local/staging only).');
  }
  let created = 0;
  for (const demo of DEMO_USERS) {
    const passwordHash = await hashPassword(demo.password);
    const inserted = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ id: randomUUID(), name: demo.name, email: demo.email, emailVerified: true, role: demo.role })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id });
      if (!user) return false;
      await tx.insert(accounts).values({
        id: randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: passwordHash,
      });
      return true;
    });
    if (inserted) created += 1;
  }
  return { created, skipped: DEMO_USERS.length - created };
}
