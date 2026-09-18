'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminHomepageProcessStepList } from '../../../services/api';
import { homepageProcessStepKeys } from '../../../utils/query-keys';
import type { HomepageProcessStepListFilters } from '../../../types';

// Small admin table — one-shot fetch on mount, no refetchInterval/polling.
export function useHomepageProcessStepList(filters: HomepageProcessStepListFilters) {
  return useQuery({
    queryKey: homepageProcessStepKeys.list(filters),
    queryFn: () => fetchAdminHomepageProcessStepList(filters),
    staleTime: 5 * 60 * 1000,
  });
}
