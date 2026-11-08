'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const GLIDE_SECONDS = 1.5;
let lenis: Lenis | null = null;

// Moves the page through the same smooth scroll the visitor's own wheel uses. Visitors who prefer
// reduced motion have no smooth scroll running, so they are moved without an animation.
export function scrollSmoothlyTo(target: HTMLElement, offset: number, onArrive?: () => void) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: GLIDE_SECONDS, onComplete: onArrive });
    return;
  }
  window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY + offset);
  onArrive?.();
}

// Lenis smooth scrolling for the public site, driven by GSAP's ticker so ScrollTrigger
// animations stay in lock-step with the smoothed scroll position. Skipped entirely for
// users who prefer reduced motion — they keep native scrolling.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // In-page links (#estimator, #work…) glide instead of jumping; offset clears the sticky header.
      anchors: { offset: -97 },
    });

    lenis = instance;
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis = null;
      instance.destroy();
    };
  }, []);

  return null;
}
