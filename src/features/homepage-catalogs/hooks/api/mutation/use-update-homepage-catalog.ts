'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHomepageCatalog } from '../../../services/api';
import { homepageCatalogKeys } from '../../../utils/query-keys';
import type { UpdateHomepageCatalogInput } from '../../../types';

export function useUpdateHomepageCatalog(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHomepageCatalogInput) => updateHomepageCatalog(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(homepageCatalogKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: homepageCatalogKeys.lists() });
    },
  });
}
