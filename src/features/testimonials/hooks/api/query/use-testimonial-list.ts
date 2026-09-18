'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminTestimonialList } from '../../../services/api';
import { testimonialKeys } from '../../../utils/query-keys';
import type { TestimonialListFilters } from '../../../types';

// Small admin table — one-shot fetch on mount, no refetchInterval/polling.
export function useTestimonialList(filters: TestimonialListFilters) {
  return useQuery({
    queryKey: testimonialKeys.list(filters),
    queryFn: () => fetchAdminTestimonialList(filters),
    staleTime: 5 * 60 * 1000,
  });
}
