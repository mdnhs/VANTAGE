import { randomUUID } from 'node:crypto';

import type { RoleName } from '@/lib/auth/permissions';
import { api } from '@/server/api';
import { getAuth } from '@/server/lib/auth';

export const PASSWORD = 'Test-Password-2026!';
export const ORIGIN = 'http://localhost:3000';

export type TestUser = { id: string; email: string };

// A user with the given role (`user` is the non-admin customer role).
export async function createTestUser(
  role: RoleName | 'user' | string,
  email = `${role.replace(/\W/g, '')}-${randomUUID()}@session.test`,
): Promise<TestUser> {
  const { user } = await getAuth().api.createUser({
    body: { email, password: PASSWORD, name: `Test ${role}`, role: role as never },
  });
  return { id: user.id, email };
}

// A `Cookie` header value for a fresh sign-in of an existing user.
export async function signInCookie(email: string, password = PASSWORD): Promise<string> {
  const response = await getAuth().api.signInEmail({ body: { email, password }, asResponse: true });
  const cookies = response.headers.getSetCookie().map((cookie) => cookie.split(';')[0]);
  if (cookies.length === 0) throw new Error('sign-in returned no session cookie');
  return cookies.join('; ');
}

// A `Cookie` header value carrying a real Better Auth session for a freshly
// created user with the given role.
export async function sessionCookie(role: RoleName | 'user' = 'owner'): Promise<string> {
  const { email } = await createTestUser(role);
  return signInCookie(email);
}

// Applies Set-Cookie values to a Cookie header the way a browser does: a later
// value for a name replaces the earlier one; an empty value deletes it.
export function applyCookies(cookie: string, setCookies: string[]): string {
  const jar = new Map(
    cookie
      .split('; ')
      .filter(Boolean)
      .map((pair) => {
        const i = pair.indexOf('=');
        return [pair.slice(0, i), pair.slice(i + 1)] as const;
      }),
  );
  for (const header of setCookies) {
    const pair = header.split(';')[0]!;
    const i = pair.indexOf('=');
    const [name, value] = [pair.slice(0, i), pair.slice(i + 1)];
    if (value) jar.set(name, value);
    else jar.delete(name);
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}

// A call to the Hono API under /api/v1.
export function call(path: string, cookie?: string, init: { method?: string; body?: unknown } = {}) {
  return api.request(`/api/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      origin: ORIGIN,
      ...(cookie ? { cookie } : {}),
      ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

// A call to Better Auth's own HTTP handler, as the Account page makes it.
export function authCall(path: string, cookie: string | undefined, body?: unknown, method?: string) {
  return getAuth().handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      headers: {
        ...(cookie ? { cookie } : {}),
        origin: ORIGIN,
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

// Starts a View-as through the API and returns the viewer's cookie.
export async function viewAsCookie(actorCookie: string, targetId: string): Promise<string> {
  const response = await call(`/admin/users/${targetId}/impersonate`, actorCookie, { method: 'POST' });
  if (response.status !== 200) throw new Error(`View-as failed with ${response.status}`);
  return applyCookies(actorCookie, response.headers.getSetCookie());
}
