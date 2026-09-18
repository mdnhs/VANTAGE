'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHomepageProcessStep } from '../../../services/api';
import { homepageProcessStepKeys } from '../../../utils/query-keys';

export function useCreateHomepageProcessStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHomepageProcessStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageProcessStepKeys.lists() });
    },
  });
}
