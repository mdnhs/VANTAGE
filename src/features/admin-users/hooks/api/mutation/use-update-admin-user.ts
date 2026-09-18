'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAdminUser } from '../../../services/api';
import { adminUserKeys } from '../../../utils/query-keys';
import type { UpdateAdminUserInput } from '../../../types';

export function useUpdateAdminUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAdminUserInput) => updateAdminUser(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(adminUserKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}
