'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderHomepageCatalogs } from '../../../services/api';
import { homepageCatalogKeys } from '../../../utils/query-keys';

export function useReorderHomepageCatalogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderHomepageCatalogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageCatalogKeys.lists() });
    },
  });
}
