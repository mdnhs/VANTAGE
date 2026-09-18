'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHomepageProcessStepDetail } from '../../../services/api';
import { homepageProcessStepKeys } from '../../../utils/query-keys';

export function useHomepageProcessStepDetail(id: string) {
  return useQuery({
    queryKey: homepageProcessStepKeys.detail(id),
    queryFn: () => fetchHomepageProcessStepDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
