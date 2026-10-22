'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateQuoteRequest } from '../../../services/api';
import { quoteRequestKeys } from '../../../utils/query-keys';
import type { UpdateQuoteRequestInput } from '../../../types';

export function useUpdateQuoteRequest(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateQuoteRequestInput) => updateQuoteRequest(id, input),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: (data) => {
      queryClient.setQueryData(quoteRequestKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.stats() });
    },
  });
}
