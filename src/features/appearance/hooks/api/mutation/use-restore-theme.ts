'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { restoreTheme } from '../../../services/api';
import { themeKeys } from '../../../utils/query-keys';

// Loads an old published theme into the draft; nothing goes live until Publish.
export function useRestoreTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ revisionId, version }: { revisionId: string; version: number }) =>
      restoreTheme(revisionId, { version }),
    onSuccess: (doc) => queryClient.setQueryData(themeKeys.detail(), doc),
  });
}
