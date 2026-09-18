import { API_ROUTES } from '@/lib/routes/api-routes';
import type {
  AdminUserWithPermissions,
  ChangePasswordInput,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Request failed');
  }
  return body.data as T;
}

export async function fetchAdminUserList(): Promise<AdminUserWithPermissions[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.admins.list}`, { credentials: 'include' });
  return parseOrThrow<AdminUserWithPermissions[]>(res);
}

export async function fetchAdminUserDetail(id: string): Promise<AdminUserWithPermissions> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.admins.detail(id)}`, { credentials: 'include' });
  return parseOrThrow<AdminUserWithPermissions>(res);
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUserWithPermissions> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.admins.create}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<AdminUserWithPermissions>(res);
}

export async function updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUserWithPermissions> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.admins.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<AdminUserWithPermissions>(res);
}

export async function resetAdminUserPassword(id: string, input: ChangePasswordInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.admins.resetPassword(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ success: true }>(res);
}
