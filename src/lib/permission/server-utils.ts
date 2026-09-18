import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/server/lib/session';
import { createPermissionChecker, decompressPermissions, type PermissionChecker } from './utils';

export interface Session {
  id: string;
  email: string;
  name: string;
  permissions: ReturnType<typeof decompressPermissions>;
}

// Server Component / layout helper — reads and verifies the session cookie directly.
// Zero database access: everything needed lives in the signed token.
export const getSession = async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  // JWT verification reads the current time (exp check) — mark it request-time so Cache
  // Components doesn't try to evaluate it while prerendering the shell around loading.tsx.
  await connection();
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    permissions: decompressPermissions(payload.permissions),
  };
};

export const getServerPermissionChecker = async (): Promise<PermissionChecker | null> => {
  const session = await getSession();
  return session ? createPermissionChecker(session.permissions) : null;
};
