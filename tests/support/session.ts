import { createSessionToken, SESSION_COOKIE, type SessionUser } from '@/server/lib/session';

// A `Cookie` header value carrying a valid session for tests.
export async function sessionCookie(user: Partial<SessionUser> = {}): Promise<string> {
  const token = await createSessionToken({
    id: 'user_test_1',
    email: 'tester@example.com',
    name: 'Tester',
    permissions: [],
    ...user,
  });
  return `${SESSION_COOKIE}=${token}`;
}
