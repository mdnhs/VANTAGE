'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSocialLinks } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateSocialLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSocialLinks,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
