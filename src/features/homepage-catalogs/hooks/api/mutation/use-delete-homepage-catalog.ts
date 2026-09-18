'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteHomepageCatalog } from '../../../services/api';
import { homepageCatalogKeys } from '../../../utils/query-keys';

export function useDeleteHomepageCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHomepageCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageCatalogKeys.lists() });
    },
  });
}
