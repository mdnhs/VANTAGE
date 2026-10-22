import { randomUUID } from 'node:crypto';

import type { RoleName } from '@/lib/auth/permissions';
import { getAuth } from '@/server/lib/auth';

const PASSWORD = 'Test-Password-2026!';

// A `Cookie` header value carrying a real Better Auth session for a freshly
// created user with the given role (`user` is the non-admin customer role).
export async function sessionCookie(role: RoleName | 'user' = 'owner'): Promise<string> {
  const email = `${role}-${randomUUID()}@session.test`;
  await getAuth().api.createUser({
    body: { email, password: PASSWORD, name: `Test ${role}`, role: role as never },
  });
  const response = await getAuth().api.signInEmail({ body: { email, password: PASSWORD }, asResponse: true });
  const cookies = response.headers.getSetCookie().map((cookie) => cookie.split(';')[0]);
  if (cookies.length === 0) throw new Error('sign-in returned no session cookie');
  return cookies.join('; ');
}
