'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAdminUser } from '../../../services/api';
import { adminUserKeys } from '../../../utils/query-keys';

// Deactivate/reactivate is the only destructive action exposed in this UI (see
// admin-user-service.ts) — no hard delete route is wired up.
export function useToggleAdminActive(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isActive: boolean) => updateAdminUser(id, { isActive }),
    onSuccess: (data) => {
      queryClient.setQueryData(adminUserKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}
