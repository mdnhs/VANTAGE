'use client';

import { gsap } from 'gsap';
import { useEffect, type RefObject } from 'react';

import { liftToClear } from '../../lib/clear-of-controls';

const CONTROLS = 'main button[aria-label^="Next"], main button[aria-label^="Previous"]';
const GAP_PX = 12;

// The chat sits in the corner where the carousels keep their arrows, so it rises while one is underneath.
export function useClearOfControls(
  ready: boolean,
  open: boolean,
  root: RefObject<HTMLDivElement | null>,
  launcher: RefObject<HTMLButtonElement | null>,
) {
  useEffect(() => {
    const widget = root.current;
    if (!ready || !widget) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let lift = 0;

    const measure = () => {
      frame = 0;
      const button = launcher.current?.getBoundingClientRect();
      if (!button) return;
      // Measured from where the widget rests, so its own rise is not counted as clearance.
      const moved = Number(gsap.getProperty(widget, 'y'));
      const row = widget.getBoundingClientRect();
      const resting = { left: row.left, right: row.right, top: button.top - moved, bottom: button.bottom - moved };
      const controls = [...document.querySelectorAll(CONTROLS)]
        .map((control) => control.getBoundingClientRect())
        .filter((box) => box.width > 0);
      const next = open ? 0 : liftToClear(resting, controls, GAP_PX);
      if (Math.abs(next - lift) < 1) return;
      lift = next;
      gsap.to(widget, { y: -lift, duration: reduced ? 0 : 0.3, ease: 'power2.out', overwrite: 'auto' });
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ready, open, root, launcher]);
}
