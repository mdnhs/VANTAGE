'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProject } from '../../../services/api';
import { projectKeys } from '../../../utils/query-keys';

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
