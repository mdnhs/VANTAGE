'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SubmitResult } from '@/components/admin/schema-form/helpers';
import type { EditableGlobalKey } from '@/lib/content/global-access';

import { isConflict, submitResultFromError } from '../../../lib/submit-result';
import { saveGlobal } from '../../../services/api';
import { globalKeys } from '../../../utils/query-keys';

// Saves one global. On success and on a 409 the stored version is refetched
// (a conflict loads the other person's version). `save` resolves to the form's
// SubmitResult: a failure the editor can explain comes back as a formError /
// fieldErrors, anything unexpected is thrown.
export function useSaveGlobal(key: EditableGlobalKey) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: globalKeys.detail(key) });
  const mutation = useMutation({
    mutationFn: (input: { version: number; value: unknown }) => saveGlobal(key, input),
    onSuccess: async () => {
      await refresh();
      await queryClient.invalidateQueries({ queryKey: globalKeys.revisions(key) });
    },
    onError: async (error) => {
      if (isConflict(error)) await refresh();
    },
  });

  async function save(input: {
    version: number;
    value: unknown;
  }): Promise<NonNullable<SubmitResult> & { saved?: boolean; conflict?: boolean }> {
    try {
      await mutation.mutateAsync(input);
      return { saved: true };
    } catch (error) {
      if (isConflict(error)) return { conflict: true };
      const result = submitResultFromError(error);
      if (!result) throw error;
      return result;
    }
  }

  return { save, isPending: mutation.isPending };
}
