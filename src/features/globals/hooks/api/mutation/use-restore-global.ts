'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { EditableGlobalKey } from '@/lib/content/global-access';

import { isConflict } from '../../../lib/submit-result';
import { restoreGlobal } from '../../../services/api';
import { globalKeys } from '../../../utils/query-keys';

// Restores a revision as a new version. A stale version (409) reloads the
// stored one so the next attempt starts from it.
export function useRestoreGlobal(key: EditableGlobalKey) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: globalKeys.detail(key) });
    await queryClient.invalidateQueries({ queryKey: globalKeys.revisions(key) });
  };
  return useMutation({
    mutationFn: (input: { revisionId: string; version: number }) =>
      restoreGlobal(key, input.revisionId, { version: input.version }),
    onSuccess: refresh,
    onError: async (error) => {
      if (isConflict(error)) await refresh();
    },
  });
}
