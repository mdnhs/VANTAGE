'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProcessPage } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateProcessPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProcessPage,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
