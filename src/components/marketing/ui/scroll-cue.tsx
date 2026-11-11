'use client';

import { motion, useReducedMotion, useTransform } from 'motion/react';
import { useSmoothScroll } from './hero-motion';

// The "scroll" hint under a full-screen hero: a mouse whose wheel dot runs down, with a small
// bob on the whole cue. It fades out as soon as the page starts to move.
export function ScrollCue({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const scrollY = useSmoothScroll();
  const opacity = useTransform(scrollY, [0, 140], [1, 0]);

  return (
    <motion.div
      data-scroll-cue
      aria-hidden='true'
      animate={{ y: reduce ? 0 : [0, 6, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ opacity }}
      className={`pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex [@media(max-height:760px)]:hidden ${className}`}
    >
      <span className='font-site-body text-[10px] tracking-[0.2em] text-white/55 uppercase'>Scroll</span>
      <span className='relative block h-[34px] w-[22px] rounded-full border border-white/45'>
        <motion.span
          data-cue-line
          animate={reduce ? { opacity: 1 } : { y: [0, 11, 11, 0], opacity: [1, 1, 0, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.55, 0.7, 1], ease: 'easeIn' }}
          className='absolute top-[6px] left-1/2 h-[7px] w-[3px] -translate-x-1/2 rounded-full bg-white/80'
        />
      </span>
    </motion.div>
  );
}
