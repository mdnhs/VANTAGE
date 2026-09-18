'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHomepageCatalog } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateHomepageCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHomepageCatalog,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
