'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPartnerLogo } from '../../../services/api';
import { partnerLogoKeys } from '../../../utils/query-keys';

export function useCreatePartnerLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPartnerLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerLogoKeys.lists() });
    },
  });
}
