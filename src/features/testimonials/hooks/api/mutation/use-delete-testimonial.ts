'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTestimonial } from '../../../services/api';
import { testimonialKeys } from '../../../utils/query-keys';

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.lists() });
    },
  });
}
