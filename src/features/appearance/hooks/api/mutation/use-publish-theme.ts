'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { publishTheme } from '../../../services/api';
import { themeKeys } from '../../../utils/query-keys';

// Publishing goes live: the stored copy and the History list both change.
export function usePublishTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishTheme,
    onSuccess: (doc) => {
      queryClient.setQueryData(themeKeys.detail(), doc);
      void queryClient.invalidateQueries({ queryKey: themeKeys.revisions() });
    },
  });
}
