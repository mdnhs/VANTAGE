'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHomepagePillar } from '../../../services/api';
import { homepagePillarKeys } from '../../../utils/query-keys';
import type { UpdateHomepagePillarInput } from '../../../types';

export function useUpdateHomepagePillar(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHomepagePillarInput) => updateHomepagePillar(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(homepagePillarKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: homepagePillarKeys.lists() });
    },
  });
}
