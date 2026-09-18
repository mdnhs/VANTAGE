'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateService } from '../../../services/api';
import { serviceKeys } from '../../../utils/query-keys';
import type { UpdateServiceInput } from '../../../types';

export function useUpdateService(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateServiceInput) => updateService(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(serviceKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}
