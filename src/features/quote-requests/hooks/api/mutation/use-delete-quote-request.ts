'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteQuoteRequest } from '../../../services/api';
import { quoteRequestKeys } from '../../../utils/query-keys';

export function useDeleteQuoteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuoteRequest,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.stats() });
    },
  });
}
