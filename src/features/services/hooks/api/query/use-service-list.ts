'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminServiceList } from '../../../services/api';
import { serviceKeys } from '../../../utils/query-keys';
import type { ServiceListFilters } from '../../../types';

// Small admin table — one-shot fetch on mount, no refetchInterval/polling.
export function useServiceList(filters: ServiceListFilters) {
  return useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: () => fetchAdminServiceList(filters),
    staleTime: 5 * 60 * 1000,
  });
}
