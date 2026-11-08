'use client';

import { useEffect, useRef } from 'react';

import { scrollSmoothlyTo } from '@/components/providers/smooth-scroll';

export const SCROLL_DELAY_MS = 400;
const GAP_BELOW_HEADER = 24;
const ALREADY_MOVED_PX = 40;

// Someone opening the quote page came to fill in the form, so after a glimpse of the banner the
// page glides down to it and the cursor lands in the first field. Only a visitor who has really
// moved down the page by then is left alone: a stray click or the tail of a trackpad scroll is not.
export function ScrollToQuoteForm() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.location.hash) return;
    const timer = setTimeout(() => {
      if (window.scrollY > ALREADY_MOVED_PX) return;
      // Within this page: the router can keep the homepage, with its own form, hidden in the document.
      const form = marker.current?.closest('main')?.querySelector<HTMLElement>('[data-quote-card]');
      if (!form) return;
      const header = document.querySelector('header')?.offsetHeight ?? 0;
      scrollSmoothlyTo(form, -(header + GAP_BELOW_HEADER), () => {
        // A phone would pop its keyboard up over the form.
        if (window.matchMedia('(hover: none)').matches) return;
        form.querySelector<HTMLElement>('input:not([tabindex="-1"])')?.focus({ preventScroll: true });
      });
    }, SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return <span ref={marker} hidden />;
}
