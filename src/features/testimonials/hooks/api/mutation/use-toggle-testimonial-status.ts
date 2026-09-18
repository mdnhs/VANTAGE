'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTestimonialStatus } from '../../../services/api';
import { testimonialKeys } from '../../../utils/query-keys';
import type { TestimonialStatus } from '../../../types';

export function useToggleTestimonialStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: TestimonialStatus) => updateTestimonialStatus(id, { status }),
    onSuccess: (data) => {
      queryClient.setQueryData(testimonialKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: testimonialKeys.lists() });
    },
  });
}
