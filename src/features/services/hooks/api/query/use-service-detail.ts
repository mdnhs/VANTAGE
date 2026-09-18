'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchServiceDetail } from '../../../services/api';
import { serviceKeys } from '../../../utils/query-keys';

export function useServiceDetail(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => fetchServiceDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
