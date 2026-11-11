'use client';

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import type { ComponentProps, PointerEvent, ReactNode } from 'react';

// A card (<article>) that leans toward the mouse: the edge nearest the pointer comes forward a few
// degrees (no zoom, no lift), then settles flat again when the pointer leaves. Mouse
// only: touch and pen input are left alone, and reduced-motion visitors get a plain card.
//
// It rotates the element itself with `transform`, which the scroll reveals in page-animations
// (opacity and y, finished before anyone can hover) never touch while it matters, and the pinned
// carousels animate `scale` and `filter` instead, so the two never fight over one property.
const LEAN = 6;
const SPRING = { stiffness: 220, damping: 20, mass: 0.6 };

export function TiltArticle({
  children,
  className,
  style,
  onPointerMove,
  onPointerLeave,
  ...rest
}: Omit<ComponentProps<typeof motion.article>, 'children'> & { children?: ReactNode }) {
  const reduce = useReducedMotion();
  // Pointer position inside the card, -0.5 (left / top) to 0.5 (right / bottom).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [LEAN, -LEAN]), SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-LEAN, LEAN]), SPRING);

  // A soft brand-red spotlight follows the pointer across the card.
  const lightX = useMotionValue(0);
  const lightY = useMotionValue(0);
  const glow = useSpring(0, { stiffness: 180, damping: 26 });
  const spotlight = useMotionTemplate`radial-gradient(280px circle at ${lightX}px ${lightY}px, rgb(var(--brand-rgb) / 0.16), transparent 65%)`;

  const move = (event: PointerEvent<HTMLElement>) => {
    onPointerMove?.(event as never);
    if (reduce || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    lightX.set(event.clientX - box.left);
    lightY.set(event.clientY - box.top);
    glow.set(1);
    px.set((event.clientX - box.left) / box.width - 0.5);
    py.set((event.clientY - box.top) / box.height - 0.5);
  };
  const leave = (event: PointerEvent<HTMLElement>) => {
    onPointerLeave?.(event as never);
    px.set(0);
    py.set(0);
    glow.set(0);
  };

  return (
    <motion.article
      {...rest}
      className={`relative ${className ?? ''}`}
      onPointerMove={move}
      onPointerLeave={leave}
      style={reduce ? style : { ...style, rotateX, rotateY, transformPerspective: 900 }}
    >
      {children}
      {!reduce && (
        <motion.span
          aria-hidden
          style={{ background: spotlight, opacity: glow }}
          className='pointer-events-none absolute inset-0 rounded-[inherit]'
        />
      )}
    </motion.article>
  );
}
