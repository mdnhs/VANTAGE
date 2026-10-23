'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { revokeUserSessions } from '../../../services/api';
import { userKeys } from '../../../utils/query-keys';

export function useRevokeSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeUserSessions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
