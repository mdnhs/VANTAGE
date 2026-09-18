import { API_ROUTES } from '@/lib/routes/api-routes';
import type { SiteSettings, UpdateSiteSettingsInput } from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Request failed');
  }
  return body.data as T;
}

export async function fetchAdminSiteSettings(): Promise<SiteSettings | null> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.siteSettings.admin}`, {
    credentials: 'include',
  });
  return parseOrThrow<SiteSettings | null>(res);
}

export async function updateSiteSettings(input: UpdateSiteSettingsInput): Promise<SiteSettings> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.siteSettings.update}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<SiteSettings>(res);
}
