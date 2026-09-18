'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProjectStatus } from '../../../services/api';
import { projectKeys } from '../../../utils/query-keys';
import type { ProjectStatus } from '../../../types';

export function useToggleProjectStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ProjectStatus) => updateProjectStatus(id, { status }),
    onSuccess: (data) => {
      queryClient.setQueryData(projectKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
