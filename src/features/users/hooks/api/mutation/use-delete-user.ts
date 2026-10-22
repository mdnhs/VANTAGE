'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteUser } from '../../../services/api';
import { userKeys } from '../../../utils/query-keys';

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
