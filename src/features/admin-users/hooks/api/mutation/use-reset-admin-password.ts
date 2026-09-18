'use client';

import { useMutation } from '@tanstack/react-query';
import { resetAdminUserPassword } from '../../../services/api';
import type { ChangePasswordInput } from '../../../types';

export function useResetAdminPassword(id: string) {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => resetAdminUserPassword(id, input),
  });
}
