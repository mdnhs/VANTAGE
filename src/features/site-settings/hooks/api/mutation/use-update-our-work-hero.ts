'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOurWorkHero } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateOurWorkHero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOurWorkHero,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
