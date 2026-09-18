'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminQuoteRequestList } from '../../../services/api';
import { quoteRequestKeys } from '../../../utils/query-keys';
import type { QuoteRequestListQuery } from '../../../types';

export function useQuoteRequestList(query: QuoteRequestListQuery) {
  return useQuery({
    queryKey: quoteRequestKeys.list(query),
    queryFn: () => fetchAdminQuoteRequestList(query),
    staleTime: 30 * 1000, // 30s fresh leads polling
  });
}
