'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createService } from '../../../services/api';
import { serviceKeys } from '../../../utils/query-keys';

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}
