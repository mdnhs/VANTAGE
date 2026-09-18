'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderPartnerLogos } from '../../../services/api';
import { partnerLogoKeys } from '../../../utils/query-keys';

export function useReorderPartnerLogos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderPartnerLogos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerLogoKeys.lists() });
    },
  });
}
