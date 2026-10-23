'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { discardTheme } from '../../../services/api';
import { themeKeys } from '../../../utils/query-keys';

export function useDiscardTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: discardTheme,
    onSuccess: (doc) => queryClient.setQueryData(themeKeys.detail(), doc),
  });
}
