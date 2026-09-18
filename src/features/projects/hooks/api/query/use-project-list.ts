'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminProjectList } from '../../../services/api';
import { projectKeys } from '../../../utils/query-keys';
import type { ProjectListFilters } from '../../../types';

// Small admin table — one-shot fetch on mount, no refetchInterval/polling.
export function useProjectList(filters: ProjectListFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => fetchAdminProjectList(filters),
    staleTime: 5 * 60 * 1000,
  });
}
