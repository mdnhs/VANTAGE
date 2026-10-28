'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLegalPage } from '../../../services/api';
import { legalPageKeys } from '../../../utils/query-keys';

export function useDeleteLegalPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLegalPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalPageKeys.lists() });
    },
  });
}
