import type { ContactMessageListQuery } from '../types';

export const contactMessageKeys = {
  all: ['contact-messages'] as const,
  lists: () => [...contactMessageKeys.all, 'list'] as const,
  list: (filters: ContactMessageListQuery) => [...contactMessageKeys.lists(), filters] as const,
  stats: () => [...contactMessageKeys.all, 'stats'] as const,
  details: () => [...contactMessageKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactMessageKeys.details(), id] as const,
};
