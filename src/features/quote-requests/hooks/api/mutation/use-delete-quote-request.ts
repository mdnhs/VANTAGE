'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteQuoteRequest } from '../../../services/api';
import { quoteRequestKeys } from '../../../utils/query-keys';

export function useDeleteQuoteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuoteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.stats() });
    },
  });
}
