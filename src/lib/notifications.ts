export const NOTIFICATION_KINDS = ['quote', 'contact', 'delivery_failed', 'capi_failed'] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  at: string;
  unread: boolean;
};

export type NotificationsDto = {
  items: NotificationItem[];
  unread: number;
  seenAt: string;
};

export const POLL_MS = 60_000;
export const NOTIFICATION_LIMIT = 20;
export const NOTIFICATION_WINDOW_DAYS = 30;

export function badgeText(unread: number): string {
  return unread > 9 ? '9+' : String(unread);
}
