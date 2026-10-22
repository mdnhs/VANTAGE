'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchUsers } from '../../../services/api';
import type { UserListQuery } from '../../../types';
import { userKeys } from '../../../utils/query-keys';

export function useUserList(query: UserListQuery) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => fetchUsers(query),
    placeholderData: keepPreviousData,
  });
}
