'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePartnerLogo } from '../../../services/api';
import { partnerLogoKeys } from '../../../utils/query-keys';
import type { UpdatePartnerLogoInput } from '../../../types';

export function useUpdatePartnerLogo(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePartnerLogoInput) => updatePartnerLogo(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(partnerLogoKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: partnerLogoKeys.lists() });
    },
  });
}
