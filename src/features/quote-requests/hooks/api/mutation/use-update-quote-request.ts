'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuoteRequest } from '../../../services/api';
import { quoteRequestKeys } from '../../../utils/query-keys';
import type { UpdateQuoteRequestInput } from '../../../types';

export function useUpdateQuoteRequest(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateQuoteRequestInput) => updateQuoteRequest(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(quoteRequestKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quoteRequestKeys.stats() });
    },
  });
}
