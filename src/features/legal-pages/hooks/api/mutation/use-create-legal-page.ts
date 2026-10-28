'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLegalPage } from '../../../services/api';
import { legalPageKeys } from '../../../utils/query-keys';

export function useCreateLegalPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLegalPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalPageKeys.lists() });
    },
  });
}
