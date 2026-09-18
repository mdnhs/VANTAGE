'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminUserList } from '../../../services/api';
import { adminUserKeys } from '../../../utils/query-keys';

// Small admin-only table — one-shot fetch on mount, no refetchInterval/polling.
export function useAdminUserList() {
  return useQuery({
    queryKey: adminUserKeys.lists(),
    queryFn: fetchAdminUserList,
    staleTime: 5 * 60 * 1000,
  });
}
