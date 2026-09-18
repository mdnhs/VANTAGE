'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPartnerLogoDetail } from '../../../services/api';
import { partnerLogoKeys } from '../../../utils/query-keys';

export function usePartnerLogoDetail(id: string) {
  return useQuery({
    queryKey: partnerLogoKeys.detail(id),
    queryFn: () => fetchPartnerLogoDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
