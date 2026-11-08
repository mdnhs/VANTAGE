'use client';

import { gsap } from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Opening plays this forwards and closing plays it backwards, so a visitor who changes their
// mind halfway sees the panel turn around from where it is instead of jumping.
function buildPanelTimeline(panel: HTMLElement, onClosed: () => void) {
  gsap.set(panel, { transformOrigin: '100% 100%' });
  return gsap
    .timeline({ paused: true, onReverseComplete: onClosed })
    .fromTo(
      panel,
      { opacity: 0, scale: 0.72, y: 36 },
      { opacity: 1, scale: 1, y: 0, duration: 0.46, ease: 'back.out(1.6)' },
    )
    .fromTo(
      panel.querySelectorAll('[data-chat-part]'),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' },
      0.16,
    );
}

export function useWidgetMotion(ready: boolean, open: boolean) {
  const panel = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const chatIcon = useRef<HTMLSpanElement>(null);
  const closeIcon = useRef<HTMLSpanElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  // The panel outlives `open` so it can animate away; assistive tech follows `open` at once.
  const [panelMounted, setPanelMounted] = useState(false);

  if (open && !panelMounted) setPanelMounted(true);
  if (!open && panelMounted && reducedMotion()) setPanelMounted(false);

  useLayoutEffect(() => {
    if (!panelMounted || !panel.current || reducedMotion()) return;
    const finishClosing = () => {
      timeline.current?.kill();
      timeline.current = null;
      setPanelMounted(false);
    };
    timeline.current ??= buildPanelTimeline(panel.current, finishClosing);
    if (open) timeline.current.timeScale(1).play();
    // Reversing from the very start never completes, which would strand an invisible panel.
    else if (timeline.current.time() === 0) finishClosing();
    else timeline.current.timeScale(2.2).reverse();
  }, [open, panelMounted]);

  useEffect(() => () => void timeline.current?.kill(), []);

  // The button arrives first; the offer beside it waits for this before it opens.
  useLayoutEffect(() => {
    if (!ready || !launcher.current || reducedMotion()) return;
    const arrival = gsap.fromTo(launcher.current, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2)' });
    return () => void arrival.revert();
  }, [ready]);

  useLayoutEffect(() => {
    if (!ready) return;
    const duration = reducedMotion() ? 0 : 0.34;
    const [shown, hidden] = open ? [closeIcon.current, chatIcon.current] : [chatIcon.current, closeIcon.current];
    gsap.to(shown, { opacity: 1, scale: 1, rotate: 0, duration, ease: 'back.out(2)', overwrite: true });
    gsap.to(hidden, {
      opacity: 0,
      scale: 0.4,
      rotate: open ? 90 : -90,
      duration: duration * 0.7,
      ease: 'power2.in',
      overwrite: true,
    });
  }, [ready, open]);

  useEffect(() => {
    const button = launcher.current;
    if (!ready || !button) return;
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const press = () => gsap.to(button, { scale: 0.88, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
      const release = () =>
        gsap.to(button, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
      button.addEventListener('pointerdown', press);
      for (const name of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(name, release);
      return () => {
        button.removeEventListener('pointerdown', press);
        for (const name of ['pointerup', 'pointercancel', 'pointerleave']) button.removeEventListener(name, release);
      };
    });

    // The button leans a few pixels towards the cursor. The resting position is measured on entry,
    // because measuring while it moves would feed its own motion back in.
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const toX = gsap.quickTo(button, 'x', { duration: 0.35, ease: 'power3' });
      const toY = gsap.quickTo(button, 'y', { duration: 0.35, ease: 'power3' });
      let centre = { x: 0, y: 0 };
      const enter = () => {
        const rect = button.getBoundingClientRect();
        centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      };
      const move = (event: PointerEvent) => {
        toX((event.clientX - centre.x) * 0.18);
        toY((event.clientY - centre.y) * 0.18);
      };
      const leave = () => {
        toX(0);
        toY(0);
      };
      button.addEventListener('pointerenter', enter);
      button.addEventListener('pointermove', move);
      button.addEventListener('pointerleave', leave);
      return () => {
        button.removeEventListener('pointerenter', enter);
        button.removeEventListener('pointermove', move);
        button.removeEventListener('pointerleave', leave);
      };
    });

    return () => mm.revert();
  }, [ready]);

  return { panel, launcher, chatIcon, closeIcon, panelMounted };
}
