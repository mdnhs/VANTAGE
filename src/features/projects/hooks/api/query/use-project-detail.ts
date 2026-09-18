'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProjectDetail } from '../../../services/api';
import { projectKeys } from '../../../utils/query-keys';

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProjectDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
