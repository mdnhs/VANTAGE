'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderTestimonials } from '../../../services/api';
import { testimonialKeys } from '../../../utils/query-keys';

export function useReorderTestimonials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderTestimonials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.lists() });
    },
  });
}
