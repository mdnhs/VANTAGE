'use client';

import { gsap } from 'gsap';
import { useEffect } from 'react';

const SELECTOR = '[data-reveal-button]';
const CLICK_FOCUS_WINDOW_MS = 400;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One pass of colour rises through the button while its label rolls out of the top and back up from below.
function reveal(button: Element) {
  const band = button.querySelector('[data-reveal-band]');
  const label = button.querySelector('[data-reveal-rise]');
  if (!band || !label) return null;
  return gsap
    .timeline()
    .fromTo(
      band,
      { yPercent: 100, opacity: 1 },
      { yPercent: -101, opacity: 1, duration: 0.55, ease: 'power1.inOut' },
      0,
    )
    .to(label, { yPercent: -115, duration: 0.2, ease: 'power2.in' }, 0)
    .fromTo(
      label,
      { yPercent: 115 },
      // Without this the label would jump below the button before it has rolled out of the top.
      { yPercent: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform', immediateRender: false },
      0.22,
    );
}

// Listens on the document, so buttons that appear later (form steps, opened menus) are covered too.
export function ButtonRevealLayer() {
  useEffect(() => {
    const running = new WeakMap<Element, gsap.core.Timeline>();
    let lastPress = 0;

    // A pass already under way is left to finish, so moving in and out never makes it stutter.
    const play = (button: Element) => {
      if (reducedMotion() || running.get(button)?.isActive()) return;
      const timeline = reveal(button);
      if (timeline) running.set(button, timeline);
    };
    const buttonOf = (target: EventTarget | null) => (target instanceof Element ? target.closest(SELECTOR) : null);

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const button = buttonOf(event.target);
      if (button && !button.contains(event.relatedTarget as Node | null)) play(button);
    };
    const onPointerDown = () => {
      lastPress = Date.now();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (Date.now() - lastPress < CLICK_FOCUS_WINDOW_MS) return;
      const button = buttonOf(event.target);
      if (button) play(button);
    };

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, []);

  return null;
}
