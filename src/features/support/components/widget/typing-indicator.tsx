'use client';

import { motion, useReducedMotion } from 'motion/react';

const DOTS = [0, 1, 2];

// A message bubble with three bouncing dots, plus the words for screen readers and sighted people.
export function TypingIndicator({ name }: { name: string }) {
  const still = useReducedMotion();
  return (
    <motion.div
      role='status'
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={still ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className='flex items-center gap-2'
    >
      <span
        aria-hidden='true'
        className='flex items-center gap-1 rounded-[14px] rounded-bl-[4px] bg-white/[0.08] px-3.5 py-3'
      >
        {DOTS.map((i) => (
          <motion.span
            key={i}
            className='size-1.5 rounded-full bg-white/60'
            style={still ? { opacity: 0.7 } : undefined}
            animate={still ? undefined : { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </span>
      <span className='text-[13px] text-white/55'>{name} is typing…</span>
    </motion.div>
  );
}
