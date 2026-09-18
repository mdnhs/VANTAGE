'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderHomepagePillars } from '../../../services/api';
import { homepagePillarKeys } from '../../../utils/query-keys';

export function useReorderHomepagePillars() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderHomepagePillars,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepagePillarKeys.lists() });
    },
  });
}
