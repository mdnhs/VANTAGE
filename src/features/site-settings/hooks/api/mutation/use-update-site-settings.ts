'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSiteSettings } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
