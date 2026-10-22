'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unbanUser } from '../../../services/api';
import { userKeys } from '../../../utils/query-keys';

export function useUnbanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unbanUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
