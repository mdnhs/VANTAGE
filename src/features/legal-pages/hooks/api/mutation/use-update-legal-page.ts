'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLegalPage } from '../../../services/api';
import { legalPageKeys } from '../../../utils/query-keys';
import type { UpdateLegalPageInput } from '../../../types';

export function useUpdateLegalPage(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLegalPageInput) => updateLegalPage(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(legalPageKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: legalPageKeys.lists() });
    },
  });
}
