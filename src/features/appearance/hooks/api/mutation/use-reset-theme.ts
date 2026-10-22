'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { resetTheme } from '../../../services/api';
import { themeKeys } from '../../../utils/query-keys';

export function useResetTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetTheme,
    onSuccess: (doc) => queryClient.setQueryData(themeKeys.detail(), doc),
  });
}
