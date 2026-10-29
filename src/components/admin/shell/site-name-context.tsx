'use client';

import { createContext, useContext } from 'react';

import { siteNameFrom } from '@/lib/content/site-name';

// The business name from Site settings for admin client components (reply subjects ...).
// Outside the admin shell it falls back to the site's domain.
const SiteNameContext = createContext<string>(siteNameFrom(null));

export const SiteNameProvider = SiteNameContext.Provider;

export function useSiteName(): string {
  return useContext(SiteNameContext);
}

// One wording for every "reply by email" link, so the subject never drifts between screens.
export const replyMailto = (email: string, subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`;
export const enquiryReplySubject = (siteName: string) => `Re: Your enquiry with ${siteName}`;
export const quoteReplySubject = (siteName: string) => `Regarding your quote request with ${siteName}`;
