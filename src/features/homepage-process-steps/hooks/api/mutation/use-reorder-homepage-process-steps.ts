'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderHomepageProcessSteps } from '../../../services/api';
import { homepageProcessStepKeys } from '../../../utils/query-keys';

export function useReorderHomepageProcessSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderHomepageProcessSteps,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageProcessStepKeys.lists() });
    },
  });
}
