'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { resendInvite } from '../../../services/api';
import { userKeys } from '../../../utils/query-keys';

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resendInvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
