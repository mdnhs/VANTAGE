'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { banUser } from '../../../services/api';
import { userKeys } from '../../../utils/query-keys';

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; days: number | null; reason?: string }) => banUser(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
