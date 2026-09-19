'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBranding } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBranding,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
