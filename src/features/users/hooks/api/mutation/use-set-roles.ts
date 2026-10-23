'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setUserRoles } from '../../../services/api';
import type { RoleName } from '@/lib/auth/permissions';

import { userKeys } from '../../../utils/query-keys';

export function useSetRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: RoleName[] }) => setUserRoles(id, roles),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
