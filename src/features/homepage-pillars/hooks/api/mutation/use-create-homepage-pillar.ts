'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHomepagePillar } from '../../../services/api';
import { homepagePillarKeys } from '../../../utils/query-keys';

export function useCreateHomepagePillar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHomepagePillar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepagePillarKeys.lists() });
    },
  });
}
