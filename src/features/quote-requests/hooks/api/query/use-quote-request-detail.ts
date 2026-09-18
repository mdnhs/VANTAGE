'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchQuoteRequestDetail } from '../../../services/api';
import { quoteRequestKeys } from '../../../utils/query-keys';

export function useQuoteRequestDetail(id: string) {
  return useQuery({
    queryKey: quoteRequestKeys.detail(id),
    queryFn: () => fetchQuoteRequestDetail(id),
    staleTime: 60 * 1000,
    enabled: Boolean(id),
  });
}
