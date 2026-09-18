'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteHomepagePillar } from '../../../services/api';
import { homepagePillarKeys } from '../../../utils/query-keys';

export function useDeleteHomepagePillar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHomepagePillar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepagePillarKeys.lists() });
    },
  });
}
