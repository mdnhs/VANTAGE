'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { inviteUser } from '../../../services/api';
import { userKeys } from '../../../utils/query-keys';

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
