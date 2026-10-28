'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminLegalPageList } from '../../../services/api';
import { legalPageKeys } from '../../../utils/query-keys';
import type { LegalPageListFilters } from '../../../types';

// Small admin table — one-shot fetch on mount, no refetchInterval/polling.
export function useLegalPageList(filters: LegalPageListFilters) {
  return useQuery({
    queryKey: legalPageKeys.list(filters),
    queryFn: () => fetchAdminLegalPageList(filters),
    staleTime: 5 * 60 * 1000,
  });
}
