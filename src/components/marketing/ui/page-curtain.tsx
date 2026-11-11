'use client';

import { motion, useReducedMotion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Page transition: a brand-red curtain sweeps up over the screen when a visitor follows a link to
// another page, the new page loads behind it, and the curtain lifts away. It is a cover over the
// normal navigation, not a replacement for it: the router does the navigating and the page itself
// is never held back, so if anything goes wrong the curtain simply lifts on a timer.
const COVER_MS = 380;
const GIVE_UP_MS = 2500;

type Phase = 'idle' | 'covering' | 'lifting';

export function PageCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const target = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduce) return;
    const clear = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      if (anchor.hasAttribute('data-no-curtain')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, or only the #hash changed: leave it to the browser and Lenis.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      target.current = url.pathname;
      setPhase('covering');
      clear();
      timers.current.push(window.setTimeout(() => router.push(url.pathname + url.search + url.hash), COVER_MS));
      timers.current.push(window.setTimeout(() => setPhase('lifting'), GIVE_UP_MS));
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      clear();
    };
  }, [router, reduce]);

  // The new route is in: lift the curtain.
  useEffect(() => {
    if (phase === 'covering' && target.current && pathname === target.current) {
      const t = window.setTimeout(() => setPhase('lifting'), 120);
      return () => window.clearTimeout(t);
    }
  }, [pathname, phase]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={
        phase === 'covering'
          ? { y: '0%', transition: { duration: COVER_MS / 1000, ease: [0.76, 0, 0.24, 1] } }
          : { y: '-100%', transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] } }
      }
      onAnimationComplete={() => {
        if (phase === 'lifting') setPhase('idle');
      }}
      style={{ y: '100%' }}
      className='pointer-events-none fixed inset-0 z-[80] bg-brand'
    />
  );
}
