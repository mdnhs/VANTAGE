'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHomepagePillarDetail } from '../../../services/api';
import { homepagePillarKeys } from '../../../utils/query-keys';

export function useHomepagePillarDetail(id: string) {
  return useQuery({
    queryKey: homepagePillarKeys.detail(id),
    queryFn: () => fetchHomepagePillarDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
