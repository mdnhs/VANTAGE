'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { ButtonLink } from '@/components/marketing/ui/landing-primitives';

export const QUOTE_HREF = '/get-a-quote';
const DEFAULT_LABEL = 'Get a Free Quote';

// The one wording of the "get a quote" button, edited in the admin under Settings > Navigation.
// The layout provides it once; every quote button below reads it through QuoteCtaText.
const QuoteCtaContext = createContext(DEFAULT_LABEL);

export function QuoteCtaProvider({ label, children }: { label: string; children: ReactNode }) {
  return <QuoteCtaContext.Provider value={label || DEFAULT_LABEL}>{children}</QuoteCtaContext.Provider>;
}

export function QuoteCtaText() {
  return <>{useContext(QuoteCtaContext)}</>;
}

// The standard quote button for pages built on ButtonLink. Hero/header buttons with their own
// artwork keep that markup and only use QuoteCtaText for the words.
export function QuoteButton({ className }: { className?: string }) {
  return (
    <ButtonLink href={QUOTE_HREF} className={className}>
      <QuoteCtaText />
    </ButtonLink>
  );
}
