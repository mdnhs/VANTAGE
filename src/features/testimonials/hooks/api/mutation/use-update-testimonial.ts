'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTestimonial } from '../../../services/api';
import { testimonialKeys } from '../../../utils/query-keys';
import type { TestimonialUpdatePayload } from '../../../types';

export function useUpdateTestimonial(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TestimonialUpdatePayload) => updateTestimonial(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(testimonialKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: testimonialKeys.lists() });
    },
  });
}
