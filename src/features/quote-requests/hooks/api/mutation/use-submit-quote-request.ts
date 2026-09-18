'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitQuoteRequest } from '../../../services/api';
import { quoteRequestKeys } from '../../../utils/query-keys';

export function useSubmitQuoteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitQuoteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.stats() });
    },
  });
}
