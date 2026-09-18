'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteHomepageProcessStep } from '../../../services/api';
import { homepageProcessStepKeys } from '../../../utils/query-keys';

export function useDeleteHomepageProcessStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHomepageProcessStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageProcessStepKeys.lists() });
    },
  });
}
