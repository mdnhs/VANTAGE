'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProject } from '../../../services/api';
import { projectKeys } from '../../../utils/query-keys';
import type { ProjectUpdatePayload } from '../../../types';

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProjectUpdatePayload) => updateProject(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(projectKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
