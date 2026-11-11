'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useEffect, useState, useSyncExternalStore } from 'react';

// A ring that trails the mouse and swells over anything clickable. It sits beside the normal
// cursor (which stays visible, so nothing is ever hard to find) and exists only for visitors with
// a real mouse: touch screens and reduced-motion visitors never see it.
const CLICKABLE = 'a, button, [role="button"], input, select, textarea, label, summary, [data-cursor]';

const subscribe = (notify: () => void) => {
  const query = window.matchMedia('(hover: hover) and (pointer: fine)');
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};

export function SiteCursor() {
  const reduce = useReducedMotion();
  const mouse = useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    () => false,
  );
  const x = useSpring(useMotionValue(-100), { stiffness: 380, damping: 32, mass: 0.4 });
  const y = useSpring(useMotionValue(-100), { stiffness: 380, damping: 32, mass: 0.4 });
  const [over, setOver] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!mouse || reduce) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      x.set(event.clientX - 18);
      y.set(event.clientY - 18);
      setVisible(true);
      setOver(Boolean((event.target as Element | null)?.closest?.(CLICKABLE)));
    };
    const leave = () => setVisible(false);
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [mouse, reduce, x, y]);

  if (!mouse || reduce) return null;

  return (
    <div aria-hidden className='pointer-events-none fixed inset-0 z-[70]'>
      <motion.div
        style={{ x, y }}
        animate={{ opacity: visible ? 1 : 0, scale: over ? 1.7 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={`size-9 rounded-full border ${over ? 'border-brand bg-brand/10' : 'border-white/45'}`}
      />
    </div>
  );
}
