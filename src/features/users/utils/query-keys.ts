import type { UserListQuery } from '../types';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserListQuery) => [...userKeys.lists(), filters] as const,
};
