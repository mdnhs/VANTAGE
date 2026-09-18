'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateServicesHero } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateServicesHero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateServicesHero,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
