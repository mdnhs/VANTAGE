'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTestimonial } from '../../../services/api';
import { testimonialKeys } from '../../../utils/query-keys';

export function useCreateTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.lists() });
    },
  });
}
