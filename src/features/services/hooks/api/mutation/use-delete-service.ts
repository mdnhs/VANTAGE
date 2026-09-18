'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteService } from '../../../services/api';
import { serviceKeys } from '../../../utils/query-keys';

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}
