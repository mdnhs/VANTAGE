'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTestimonialDetail } from '../../../services/api';
import { testimonialKeys } from '../../../utils/query-keys';

export function useTestimonialDetail(id: string) {
  return useQuery({
    queryKey: testimonialKeys.detail(id),
    queryFn: () => fetchTestimonialDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
