'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminUserDetail } from '../../../services/api';
import { adminUserKeys } from '../../../utils/query-keys';

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => fetchAdminUserDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
