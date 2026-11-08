'use client';

import { gsap } from 'gsap';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';

// Navigation is never delayed: once a route has changed, the new page simply fades up quickly.
// Only opacity moves, so the sticky header, the chat button and pinned sections are undisturbed.
export function RouteFade() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(
      '[data-route-content]',
      { opacity: 0.2 },
      { opacity: 1, duration: 0.25, ease: 'power1.out', overwrite: true, clearProps: 'opacity' },
    );
  }, [pathname]);

  return null;
}
