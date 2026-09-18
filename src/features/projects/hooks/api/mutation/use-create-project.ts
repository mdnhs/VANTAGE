'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject } from '../../../services/api';
import { projectKeys } from '../../../utils/query-keys';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
