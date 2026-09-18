'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHomepageCatalog } from '../../../services/api';
import { homepageCatalogKeys } from '../../../utils/query-keys';

export function useCreateHomepageCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHomepageCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageCatalogKeys.lists() });
    },
  });
}
