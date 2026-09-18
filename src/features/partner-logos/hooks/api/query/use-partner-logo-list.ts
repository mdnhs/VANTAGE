'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminPartnerLogoList } from '../../../services/api';
import { partnerLogoKeys } from '../../../utils/query-keys';
import type { PartnerLogoListFilters } from '../../../types';

// Small admin table — one-shot fetch on mount, no refetchInterval/polling.
export function usePartnerLogoList(filters: PartnerLogoListFilters) {
  return useQuery({
    queryKey: partnerLogoKeys.list(filters),
    queryFn: () => fetchAdminPartnerLogoList(filters),
    staleTime: 5 * 60 * 1000,
  });
}
