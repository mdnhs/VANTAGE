'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInsurancePage } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateInsurancePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInsurancePage,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
