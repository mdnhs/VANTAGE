import type { QuoteRequestListQuery } from '../types';

export const quoteRequestKeys = {
  all: ['quote-requests'] as const,
  lists: () => [...quoteRequestKeys.all, 'list'] as const,
  list: (filters: QuoteRequestListQuery) => [...quoteRequestKeys.lists(), filters] as const,
  stats: () => [...quoteRequestKeys.all, 'stats'] as const,
  details: () => [...quoteRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...quoteRequestKeys.details(), id] as const,
};
