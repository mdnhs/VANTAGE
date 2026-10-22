import type { NotificationsDto } from '@/lib/notifications';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}/admin/notifications`;

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) throw new Error(body?.error?.message ?? 'Request failed');
  return body.data as T;
}

export async function fetchNotifications(): Promise<NotificationsDto> {
  return parse<NotificationsDto>(await fetch(BASE_URL, { credentials: 'include' }));
}

export async function markNotificationsSeen(): Promise<{ seenAt: string }> {
  return parse<{ seenAt: string }>(await fetch(`${BASE_URL}/seen`, { method: 'POST', credentials: 'include' }));
}
