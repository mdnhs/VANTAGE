import type { RoleName } from '@/lib/auth/permissions';
import type { InviteInput } from '@/validations/user-admin-schema';

import type { InviteResult, ResendResult, UserListQuery, UserListResult } from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}/admin/users`;

// Carries the server's per-field messages (422 `causes`) for inline form errors.
export class UsersApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

async function parse<T>(res: Response): Promise<{ data: T; total?: number }> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new UsersApiError(body?.error?.message ?? 'Request failed', body?.error?.code, body?.error?.causes);
  }
  return { data: body.data as T, total: body.pagination?.total };
}

const send = (path: string, method: string, body?: unknown) =>
  fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });

export async function fetchUsers(query: UserListQuery): Promise<UserListResult> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.q) params.set('q', query.q);
  if (query.role) params.set('role', query.role);
  if (query.status) params.set('status', query.status);
  const res = await fetch(`${BASE_URL}?${params.toString()}`, { credentials: 'include' });
  const { data, total } = await parse<UserListResult['items']>(res);
  return { items: data, total: total ?? data.length };
}

export const inviteUser = async (input: InviteInput) =>
  (await parse<InviteResult>(await send('/invite', 'POST', input))).data;
export const resendInvite = async (id: string) =>
  (await parse<ResendResult>(await send(`/${id}/resend-invite`, 'POST'))).data;
export const setUserRoles = async (id: string, roles: RoleName[]) =>
  (await parse<unknown>(await send(`/${id}/role`, 'PATCH', { roles }))).data;
export const banUser = async (id: string, input: { days: number | null; reason?: string }) =>
  (await parse<unknown>(await send(`/${id}/ban`, 'POST', input))).data;
export const unbanUser = async (id: string) => (await parse<unknown>(await send(`/${id}/unban`, 'POST'))).data;
export const revokeUserSessions = async (id: string) =>
  (await parse<unknown>(await send(`/${id}/sessions`, 'DELETE'))).data;
export const deleteUser = async (id: string) => (await parse<unknown>(await send(`/${id}`, 'DELETE'))).data;
export const startViewAs = async (id: string) => (await parse<unknown>(await send(`/${id}/impersonate`, 'POST'))).data;
