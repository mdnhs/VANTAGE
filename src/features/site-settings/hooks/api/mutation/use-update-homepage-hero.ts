'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHomepageHero } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateHomepageHero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHomepageHero,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
