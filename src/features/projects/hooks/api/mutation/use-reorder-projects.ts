'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderProjects } from '../../../services/api';
import { projectKeys } from '../../../utils/query-keys';

export function useReorderProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderProjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
