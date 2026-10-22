'use client';

import { useQuery } from '@tanstack/react-query';

import { useCan } from '@/contexts/actor-provider';
import { fetchContactMessageStats } from '@/features/contact-messages/services/api';
import { contactMessageKeys } from '@/features/contact-messages/utils/query-keys';
import { fetchQuoteRequestStats } from '@/features/quote-requests/services/api';
import { quoteRequestKeys } from '@/features/quote-requests/utils/query-keys';

// The sidebar badge: new quote requests plus new contact messages, each only
// when the actor may read it. Same keys as the stats hooks, so the screens and
// the badge share one cache entry; the badge alone polls (overriding the
// client's no-polling default) so a new enquiry shows without a reload.
const LIVE = { staleTime: 30_000, refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

export function useNewEnquiriesCount(): number {
  const canQuotes = useCan({ quote: ['read'] });
  const canContacts = useCan({ contact: ['read'] });
  const quotes = useQuery({
    queryKey: quoteRequestKeys.stats(),
    queryFn: () => fetchQuoteRequestStats(),
    enabled: canQuotes,
    ...LIVE,
  });
  const contacts = useQuery({
    queryKey: contactMessageKeys.stats(),
    queryFn: () => fetchContactMessageStats(),
    enabled: canContacts,
    ...LIVE,
  });
  return (canQuotes ? (quotes.data?.new ?? 0) : 0) + (canContacts ? (contacts.data?.new ?? 0) : 0);
}
