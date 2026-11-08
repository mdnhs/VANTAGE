import type { SupportStatus } from '@/lib/support/types';

export const SUPPORT_QUERY_KEYS = {
  all: ['support'] as const,
  unread: () => [...SUPPORT_QUERY_KEYS.all, 'unread'] as const,
  agents: () => [...SUPPORT_QUERY_KEYS.all, 'agents'] as const,
  lists: () => [...SUPPORT_QUERY_KEYS.all, 'list'] as const,
  list: (status: SupportStatus, limit: number) => [...SUPPORT_QUERY_KEYS.lists(), status, limit] as const,
  detail: (id: string) => [...SUPPORT_QUERY_KEYS.all, 'detail', id] as const,
};
