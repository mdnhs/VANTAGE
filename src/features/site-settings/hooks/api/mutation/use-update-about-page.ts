'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAboutPage } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateAboutPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAboutPage,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
