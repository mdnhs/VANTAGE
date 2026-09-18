import { sign, verify } from 'hono/jwt';
import { serverEnv } from '@/lib/env';
import { compressPermissions } from '@/lib/permission/utils';
import type { PermissionValue } from '@/lib/permission/permissions';

export const SESSION_COOKIE = 'vantage_session';

// 8 hours, in seconds — used for both the JWT `exp` claim and the cookie `maxAge`.
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  // Compressed permissions string (see src/lib/permission/utils.ts) — kept small in the
  // signed cookie and decompressed once by `resolveUser`/`getSession`.
  permissions: string;
  exp: number;
  [key: string]: unknown;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  permissions: PermissionValue[];
}

export const createSessionToken = async (user: SessionUser): Promise<string> => {
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    permissions: compressPermissions(user.permissions),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  return sign(payload, serverEnv().AUTH_SECRET);
};

// Never throws — any invalid/expired/malformed token resolves to `null` so callers can
// treat "no session" and "bad session" identically.
export const verifySessionToken = async (token: string | undefined | null): Promise<SessionPayload | null> => {
  if (!token) return null;
  try {
    const payload = await verify(token, serverEnv().AUTH_SECRET, 'HS256');
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
};
