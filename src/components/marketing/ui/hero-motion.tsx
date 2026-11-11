'use client';

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react';
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';

// The hero intro and scroll behaviour for every public page, in motion. The hero markup stays a
// server component; these small client wrappers only add the animation. The stagger runs from
// HeroCopy (and HeroStagger) down through HeroItem, HeroHeading and HeroLine.

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.2 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

// Buttons arrive with a little overshoot, as if pressed up into place.
const pop: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } },
};

const heading: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};

// Each headline line rises out of its own mask with a slight tilt.
const line: Variants = {
  hidden: { y: '112%', rotate: 2.5 },
  show: { y: '0%', rotate: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } },
};

// The page position as the hero effects read it, eased by a light spring. Lenis moves the page in
// the same frame the effect reads it, so a raw read lands one frame late and the copy trembles,
// most visibly on the way back up; the spring evens that out.
export function useSmoothScroll() {
  const { scrollY } = useScroll();
  return useSpring(scrollY, { stiffness: 220, damping: 32, mass: 0.4, restDelta: 0.1 });
}

const subscribe = (notify: () => void) => {
  const query = window.matchMedia('(min-width: 640px)');
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};

// Phones stack the hero (photo, then copy), so the scroll-linked drift is for sm and up only.
function useWide() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(min-width: 640px)').matches,
    () => false,
  );
}

export function HeroCopy({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const scrollY = useSmoothScroll();
  // The copy drifts up and dissolves as the page takes over.
  const y = useTransform(scrollY, [0, 600], [0, -110]);
  const opacity = useTransform(scrollY, [0, 520], [1, 0]);
  return (
    <motion.div
      data-hero-copy
      variants={container}
      initial='hidden'
      animate='show'
      style={wide && !reduce ? { y, opacity, willChange: 'transform, opacity' } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// A group that staggers in when it scrolls into view (the trust row under the hero copy), once.
export function HeroStagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      data-hero-trust
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.2, delayChildren: 0.05 } } }}
      initial='hidden'
      whileInView='show'
      viewport={{ once: true, amount: 0.35 }}
      className={`relative ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({
  children,
  className,
  kind = 'rise',
}: {
  children: ReactNode;
  className?: string;
  kind?: 'rise' | 'pop';
}) {
  return (
    <motion.div variants={kind === 'pop' ? pop : rise} className={className}>
      {children}
    </motion.div>
  );
}

// The line above the trust row draws itself across, brand red leading into the grey rule.
export function HeroRule({ className = '' }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      variants={{
        hidden: { scaleX: 0 },
        show: { scaleX: 1, transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={`pointer-events-none absolute top-0 left-0 h-px w-full origin-left bg-[linear-gradient(90deg,rgb(var(--brand-rgb)),#2e343e_35%,#2e343e)] ${className}`}
    />
  );
}

// A trust item arrives from further down with a springy settle, so the row is hard to miss.
export function HeroTrustItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 48, scale: 0.92 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 170, damping: 18 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// The icon tile: pops in with a turn.
export function HeroIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { scale: 0, rotate: -90 },
        show: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 14, delay: 0.15 } },
      }}
      whileHover={{ rotate: -8, scale: 1.08 }}
      className={`relative ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}

// Title and subtitle slide in from the left a beat after their icon.
export function HeroTrustText({
  children,
  className,
  delay = 0.3,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      variants={{
        hidden: { opacity: 0, x: -18 },
        show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE, delay } },
      }}
      className={className}
    >
      {children}
    </motion.span>
  );
}

// Counts the first number in a line up from zero when it scrolls into view ("4.9★" climbs to 4.9,
// "180+" to 180). The full text is in the markup from the start, so crawlers and no-JS see it.
export function CountText({ text, duration = 1.6, delay = 0.45 }: { text: string; duration?: number; delay?: number }) {
  const match = /\d+(?:\.\d+)?/.exec(text);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const target = match ? Number.parseFloat(match[0]) : 0;
  const decimals = match?.[0].split('.')[1]?.length ?? 0;
  const value = useMotionValue(target);
  const shown = useTransform(value, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (!match || !inView || reduce) return;
    value.set(0);
    const controls = animate(value, target, { duration, delay, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, match, target, value, duration, delay]);

  if (!match) return <>{text}</>;
  const start = match.index;
  return (
    <span ref={ref}>
      {text.slice(0, start)}
      <motion.span>{shown}</motion.span>
      {text.slice(start + match[0].length)}
    </span>
  );
}

export function HeroHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.h1 variants={heading} className={className}>
      {children}
    </motion.h1>
  );
}

export function HeroLine({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className='[margin-bottom:-0.06em] block overflow-hidden pb-[0.06em]'>
      <motion.span variants={line} className={`block origin-bottom-left ${className}`}>
        {children}
      </motion.span>
    </span>
  );
}

// The photo or video settles in from a slight zoom (transform only: a blur filter on a full-width
// image repaints every frame and janks the page load) and leans a few pixels toward the pointer on
// desktop. It does not drift with the scroll: a full-width image moved from JS while Lenis scrolls
// the page shimmers, because the two run on separate frame loops.
export function HeroMedia({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 60, damping: 20 });
  const y = useSpring(pointerY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth - 0.5) * -18);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * -12);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, pointerX, pointerY]);

  return (
    <motion.div
      data-hero-media
      initial={reduce ? false : { scale: 1.12 }}
      animate={{ scale: 1.04 }}
      transition={{ duration: 1.6, ease: EASE, delay: 0.1 }}
      style={{ willChange: 'transform' }}
      className='absolute inset-0'
    >
      <motion.div style={reduce ? undefined : { x, y }} className='absolute -inset-[18px]'>
        {children}
      </motion.div>
    </motion.div>
  );
}
