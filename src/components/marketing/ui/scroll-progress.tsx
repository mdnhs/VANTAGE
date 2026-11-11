'use client';

import { motion, useScroll, useSpring } from 'motion/react';

// The thin brand-red line along the top edge that fills as the page is read.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className='pointer-events-none fixed top-0 right-0 left-0 z-[45] h-[3px] origin-left bg-brand'
    />
  );
}
