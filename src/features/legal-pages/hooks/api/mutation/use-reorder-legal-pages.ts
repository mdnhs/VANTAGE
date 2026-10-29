'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderLegalPages } from '../../../services/api';
import { legalPageKeys } from '../../../utils/query-keys';

export function useReorderLegalPages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderLegalPages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalPageKeys.lists() });
    },
  });
}
