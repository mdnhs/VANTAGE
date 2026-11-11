'use client';

import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

// Small scroll-reveal pieces built on motion, for server components that cannot call it directly.

const EASE = [0.16, 1, 0.3, 1] as const;

const group: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.14 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

// A block whose RevealItem children rise one after the other once it scrolls into view.
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={group}
      initial='hidden'
      whileInView='show'
      viewport={{ once: true, amount: 0.12 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}

// A photo that opens like a curtain: the frame wipes up from the bottom, with no zoom.
export function ClipReveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1.1, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// A tick that draws itself, for the "request sent" badge.
export function DrawCheck({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' aria-hidden>
      <motion.path
        d='M5 12.5l4.5 4.5L19 7.5'
        stroke='#00d492'
        strokeWidth={2.4}
        strokeLinecap='round'
        strokeLinejoin='round'
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  );
}
