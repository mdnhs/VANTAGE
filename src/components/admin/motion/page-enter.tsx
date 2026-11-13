'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

// The admin's one easing: quick out, soft landing.
export const ADMIN_EASE = [0.2, 0.8, 0.2, 1] as const;

// A screen arriving: a short fade and rise. Used by route templates, which Next remounts on every
// navigation, so the layout around them (sidebar, section menu) stays still while the page moves.
export function PageEnter({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className='min-w-0'
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ADMIN_EASE }}
    >
      {children}
    </motion.div>
  );
}
