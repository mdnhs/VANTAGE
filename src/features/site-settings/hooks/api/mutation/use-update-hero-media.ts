'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHeroMedia } from '../../../services/api';
import { SITE_SETTINGS_QUERY_KEY } from '../query/use-site-settings';

export function useUpdateHeroMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHeroMedia,
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });
}
