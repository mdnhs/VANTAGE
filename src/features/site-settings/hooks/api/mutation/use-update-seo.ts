'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSeo } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateSeo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSeo,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
