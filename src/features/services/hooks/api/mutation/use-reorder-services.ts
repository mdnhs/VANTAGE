'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderServices } from '../../../services/api';
import { serviceKeys } from '../../../utils/query-keys';

export function useReorderServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderServices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}
