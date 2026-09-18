'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchQuoteRequestStats } from '../../../services/api';
import { quoteRequestKeys } from '../../../utils/query-keys';

export function useQuoteRequestStats() {
  return useQuery({
    queryKey: quoteRequestKeys.stats(),
    queryFn: () => fetchQuoteRequestStats(),
    staleTime: 30 * 1000,
  });
}
