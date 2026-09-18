'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePartnerLogo } from '../../../services/api';
import { partnerLogoKeys } from '../../../utils/query-keys';

export function useDeletePartnerLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePartnerLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerLogoKeys.lists() });
    },
  });
}
