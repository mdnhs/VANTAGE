'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminHomepagePillarList } from '../../../services/api';
import { homepagePillarKeys } from '../../../utils/query-keys';
import type { HomepagePillarListFilters } from '../../../types';

// Small admin table — one-shot fetch on mount, no refetchInterval/polling.
export function useHomepagePillarList(filters: HomepagePillarListFilters) {
  return useQuery({
    queryKey: homepagePillarKeys.list(filters),
    queryFn: () => fetchAdminHomepagePillarList(filters),
    staleTime: 5 * 60 * 1000,
  });
}
