import { API_ROUTES } from '@/lib/routes/api-routes';
import type { SeoHealth } from '@/lib/seo/health-types';

const baseUrl = () => `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

export async function fetchSeoOverview(): Promise<SeoHealth> {
  const res = await fetch(`${baseUrl()}${API_ROUTES.seo.overview}`, { credentials: 'include' });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) throw new Error(body?.error?.message ?? 'Request failed');
  return body.data as SeoHealth;
}
