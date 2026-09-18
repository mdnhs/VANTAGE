'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAdminUser } from '../../../services/api';
import { adminUserKeys } from '../../../utils/query-keys';

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}
