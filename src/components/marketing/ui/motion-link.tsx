'use client';

import Link from 'next/link';
import { MotionConfig, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import type { ComponentProps, PointerEvent, ReactNode } from 'react';

// The site's button feel: the button leans a few pixels toward the mouse as it nears (a magnet),
// settles back when the mouse leaves, and presses in on tap. Used by the shared button
// primitives, which are server components and so cannot call motion themselves.
export const PRESS = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 28 },
};

export function useMagnet(strength = 0.25) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.5 });
  if (reduce) return { style: undefined, onPointerMove: undefined, onPointerLeave: undefined };
  return {
    style: { x: sx, y: sy },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'mouse') return;
      const box = event.currentTarget.getBoundingClientRect();
      x.set((event.clientX - box.left - box.width / 2) * strength);
      y.set((event.clientY - box.top - box.height / 2) * strength);
    },
    onPointerLeave: () => {
      x.set(0);
      y.set(0);
    },
  };
}

const MotionAnchor = motion.create(Link);

export function MotionLink({ style, ...props }: ComponentProps<typeof Link>) {
  const magnet = useMagnet();
  // Link's and motion's event-handler types overlap on a few names; the props pass straight through.
  const anchorProps = {
    ...props,
    ...PRESS,
    onPointerMove: magnet.onPointerMove,
    onPointerLeave: magnet.onPointerLeave,
    style: { ...style, ...magnet.style },
  };
  return <MotionAnchor {...(anchorProps as object as ComponentProps<typeof MotionAnchor>)} />;
}

// One switch for every motion animation on the public site: visitors who ask their system to
// reduce motion get no transforms.
export function SiteMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion='user'>{children}</MotionConfig>;
}
