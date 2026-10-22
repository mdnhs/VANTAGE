'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { POLL_MS, type NotificationsDto } from '@/lib/notifications';

import { fetchNotifications, markNotificationsSeen } from '../services/api';
import { notificationKeys } from '../utils/query-keys';

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: fetchNotifications,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}

// Cache is cleared only once the server confirms. While viewing as someone else the server answers 403;
// that is expected and swallowed (the feed simply stays unread).
export function useMarkNotificationsSeen() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsSeen,
    onSuccess: ({ seenAt }) => {
      client.setQueryData<NotificationsDto>(notificationKeys.all, (old) =>
        old ? { items: old.items.map((i) => ({ ...i, unread: false })), unread: 0, seenAt } : old,
      );
    },
    onError: () => {},
  });
}
