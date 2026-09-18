'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHomepageProcessStep } from '../../../services/api';
import { homepageProcessStepKeys } from '../../../utils/query-keys';
import type { UpdateHomepageProcessStepInput } from '../../../types';

export function useUpdateHomepageProcessStep(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHomepageProcessStepInput) => updateHomepageProcessStep(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(homepageProcessStepKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: homepageProcessStepKeys.lists() });
    },
  });
}
