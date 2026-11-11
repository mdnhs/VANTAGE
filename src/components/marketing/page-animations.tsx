'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

gsap.registerPlugin(ScrollTrigger);

// Clears the sticky header, matching the offset of Lenis's in-page anchors.
const HEADER_OFFSET = 97;

// GSAP motion for every marketing page, applied over the server-rendered sections without
// wiring refs into each one: scroll reveals for every later section's heading block and cards,
// the pinned timelines and carousels. The hero itself is animated with motion (ui/hero-motion.tsx).
// Reduced-motion users get static content.
//
// Render it as the LAST child of each marketing page's <main>, not in the layout: with
// cacheComponents the page body streams and hydrates after the layout, and pinning wraps
// sections in GSAP spacers — if that ran before the page hydrated, React would hit a hydration
// mismatch and re-render the page, wiping every animation. Inside <main> its effect only fires
// once its own boundary has hydrated. The observer below is a fallback for nested suspense.
export function PageAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    let ctx: gsap.Context | undefined;
    let stopWatching = () => {};
    const isReady = () => Boolean(document.querySelector('main section'));
    const start = () => {
      ctx = gsap.context(setup);
      ScrollTrigger.refresh();
      scrollToHash();
      stopWatching = refreshWhenResized();
    };

    const stop = () => {
      stopWatching();
      ctx?.revert();
    };

    if (isReady()) {
      start();
      return stop;
    }

    const observer = new MutationObserver(() => {
      if (!isReady()) return;
      observer.disconnect();
      start();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      stop();
    };
  }, [pathname]);

  return null;
}

// Pinned sections add height once GSAP runs, so the browser's own jump to /#estimator lands short.
function scrollToHash() {
  const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
  if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET);
}

// The multi-step form changes height as it advances, which would leave every pin below it stale.
function refreshWhenResized() {
  const watched = document.querySelector('[data-refresh-scroll]');
  if (!watched) return () => {};
  let height = watched.getBoundingClientRect().height;
  const refresh = gsap.delayedCall(0.25, () => ScrollTrigger.refresh()).pause();
  const observer = new ResizeObserver(() => {
    const next = watched.getBoundingClientRect().height;
    if (Math.abs(next - height) < 1) return;
    height = next;
    refresh.restart(true);
  });
  observer.observe(watched);
  return () => {
    observer.disconnect();
    refresh.kill();
  };
}

function setup() {
  const mm = gsap.matchMedia();

  // Desktop timelines (lg and up). Insurance's seven steps (`[data-steps-h]`) pin in place and walk
  // through the steps with the scroll: each number lights up, its rail draws on to the next, and
  // the step's text comes up from dim. Process's vertical list (`[data-steps-v]`) is not pinned:
  // each phase's number, rail and card follow the scroll as it passes.
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    const colours = (dots: (HTMLElement | null)[]) => {
      const [first, second] = dots;
      if (!first || !second) return null;
      const active = getComputedStyle(first);
      const rest = getComputedStyle(second);
      return {
        on: { backgroundColor: active.backgroundColor, borderColor: active.borderTopColor },
        off: { backgroundColor: rest.backgroundColor, borderColor: rest.borderTopColor },
      };
    };

    document.querySelectorAll<HTMLElement>('[data-steps-h]').forEach((list) => {
      const section = list.closest('section');
      const steps = gsap.utils.toArray<HTMLElement>('[data-timeline-step]', list);
      const dots = steps.map((step) => step.querySelector<HTMLElement>('[data-timeline-dot]'));
      const palette = colours(dots);
      if (!section || !palette) return;

      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top 97px',
          end: `+=${steps.length * 170}`,
          pin: true,
          scrub: 0.35,
          anticipatePin: 1,
        },
      });
      steps.forEach((step, index) => {
        const dot = dots[index];
        const body = step.querySelector('[data-timeline-body]');
        const fill = step.querySelector('[data-timeline-fill]');
        if (dot) {
          gsap.set(dot, palette.off);
          timeline.to(dot, { ...palette.on, scale: 1.12, duration: 0.3 }, index);
          timeline.to(dot, { scale: 1, duration: 0.2 }, index + 0.3);
        }
        if (body) {
          gsap.set(body, { autoAlpha: 0.3, y: 14 });
          timeline.to(body, { autoAlpha: 1, y: 0, duration: 0.5 }, index);
        }
        if (fill) timeline.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'none' }, index + 0.3);
      });
    });

    document.querySelectorAll<HTMLElement>('[data-steps-v]').forEach((list) => {
      const steps = gsap.utils.toArray<HTMLElement>('[data-timeline-step]', list);
      const dots = steps.map((step) => step.querySelector<HTMLElement>('[data-timeline-dot]'));
      const palette = colours(dots);
      if (!palette) return;

      steps.forEach((step, index) => {
        const dot = dots[index];
        const body = step.querySelector('[data-timeline-body]');
        const fill = step.querySelector('[data-timeline-fill]');
        if (body) {
          gsap.from(body, {
            autoAlpha: 0,
            y: 40,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: step, start: 'top 85%', toggleActions: 'play none none reverse' },
          });
        }
        if (dot) {
          gsap.set(dot, palette.off);
          gsap
            .timeline({ scrollTrigger: { trigger: dot, start: 'top 65%', toggleActions: 'play none none reverse' } })
            .to(dot, { ...palette.on, scale: 1.14, duration: 0.3, ease: 'back.out(2)' })
            .to(dot, { scale: 1, duration: 0.2, ease: 'power2.out' });
        }
        if (fill) {
          gsap.fromTo(
            fill,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: { trigger: step, start: 'top 65%', end: 'bottom 65%', scrub: true },
            },
          );
        }
      });
    });
  });

  // Phone timelines (`[data-timeline]`: the homepage, Process and Insurance phases): each step
  // rises in as it is reached, its number turns brand red, and the rail fills down with the scroll.
  mm.add('(max-width: 639px) and (prefers-reduced-motion: no-preference)', () => {
    document.querySelectorAll<HTMLElement>('[data-timeline]').forEach((list) => {
      const steps = gsap.utils.toArray<HTMLElement>('[data-timeline-step]', list);
      const dots = steps.map((step) => step.querySelector<HTMLElement>('[data-timeline-dot]'));
      const [first, second] = dots;
      if (!first || !second) return;
      // The first number is brand red and the second neutral in the markup: read both colours
      // from them instead of repeating them here.
      const active = getComputedStyle(first);
      const rest = getComputedStyle(second);
      const on = { backgroundColor: active.backgroundColor, borderColor: active.borderTopColor };
      const off = { backgroundColor: rest.backgroundColor, borderColor: rest.borderTopColor };

      steps.forEach((step, index) => {
        const dot = dots[index];
        const body = step.querySelector('[data-timeline-body]');
        const fill = step.querySelector('[data-timeline-fill]');
        if (body) {
          gsap.from(body, {
            autoAlpha: 0,
            y: 28,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: { trigger: step, start: 'top 85%', toggleActions: 'play none none reverse' },
          });
        }
        if (dot) {
          gsap.set(dot, off);
          gsap
            .timeline({ scrollTrigger: { trigger: dot, start: 'top 65%', toggleActions: 'play none none reverse' } })
            .to(dot, { ...on, scale: 1.14, duration: 0.3, ease: 'back.out(2)' })
            .to(dot, { scale: 1, duration: 0.2, ease: 'power2.out' });
        }
        if (fill) {
          gsap.fromTo(
            fill,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: { trigger: step, start: 'top 65%', end: 'bottom 65%', scrub: true },
            },
          );
        }
      });
    });
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // The hero (intro, scroll drift, media parallax, scroll cue) is animated with motion in
    // ui/hero-motion.tsx; it is only located here so the scroll reveals below skip it.
    const hero = document.querySelector<HTMLElement>('[data-hero-copy]')?.closest('section');

    // Every section after the hero, including the closing CTA rendered by the layout.
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main section, section#contact')).filter(
      (section) => section !== hero,
    );

    sections.forEach((section) => {
      const heading = section.querySelector('h2');
      if (heading) {
        const intro = Array.from(
          heading.parentElement?.parentElement?.querySelectorAll(':scope > p, :scope > div > p') ?? [],
        );
        // Titles wrapped in SectionTitle animate themselves with motion; the eyebrow and intro around
        // them still come in here.
        const headingBlock = [heading.previousElementSibling, heading, ...intro].filter(
          (el): el is Element => Boolean(el) && !el!.closest('article, form') && !el!.hasAttribute('data-motion-title'),
        );
        gsap.from(headingBlock, {
          autoAlpha: 0,
          y: 32,
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
        });
      }

      const cards = section.querySelectorAll('article');
      if (cards.length) {
        gsap.set(cards, { autoAlpha: 0, y: 48 });
        ScrollTrigger.batch(cards, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }),
        });
      }

      // Short lists pop in one at a time, each with its icon landing a beat later.
      const popouts = Array.from(section.querySelectorAll<HTMLElement>('[data-popout]'));
      if (popouts.length) {
        const sequence = gsap.timeline({ scrollTrigger: { trigger: popouts[0], start: 'top 85%', once: true } });
        popouts.forEach((item, index) => {
          const at = index * 0.2;
          sequence.fromTo(
            item,
            { autoAlpha: 0, scale: 0.86, y: 18, transformOrigin: '0% 50%' },
            { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.9)' },
            at,
          );
          const icon = item.querySelector('[data-popout-icon]');
          if (icon) {
            sequence.fromTo(
              icon,
              { scale: 0, rotate: -45 },
              { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(3)' },
              at + 0.1,
            );
          }
        });
      }

      const form = section.querySelector('form');
      if (form) {
        gsap.from(form, {
          autoAlpha: 0,
          y: 40,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: form, start: 'top 85%', once: true },
        });
      }
    });

    // Closing CTA banner grows into place as it scrolls up the viewport.
    const banner = document.querySelector('section#contact h2')?.closest('[class*="rounded"]');
    if (banner) {
      gsap.fromTo(
        banner,
        { scale: 0.88, borderRadius: 48 },
        {
          scale: 1,
          borderRadius: 24,
          ease: 'none',
          scrollTrigger: { trigger: banner, start: 'top bottom', end: 'top 35%', scrub: true },
        },
      );
    }
  });

  // Reading aids: big step numbers that drift against the
  // scroll, and body copy that lights up word by word as it is read. Everything is restored on
  // cleanup, and the words stay in the DOM at partial opacity so crawlers and readers see them.
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const cleanups: Array<() => void> = [];

    document.querySelectorAll<HTMLElement>('[data-drift]').forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: -35 },
        {
          yPercent: 25,
          ease: 'none',
          scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });

    document.querySelectorAll<HTMLElement>('[data-scrub-text]').forEach((el) => {
      const original = el.innerHTML;
      const words = (el.textContent ?? '').split(/\s+/).filter(Boolean);
      if (words.length === 0) return;
      el.textContent = '';
      const spans = words.map((word, index) => {
        const span = document.createElement('span');
        span.textContent = word;
        el.append(span);
        if (index < words.length - 1) el.append(' ');
        return span;
      });
      cleanups.push(() => {
        el.innerHTML = original;
      });
      gsap.fromTo(
        spans,
        { opacity: 0.2 },
        {
          opacity: 1,
          stagger: 0.12,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 50%', scrub: true },
        },
      );
    });

    return () => cleanups.forEach((fn) => fn());
  });

  // Pointer-only play (never on touch): primary buttons lean toward the cursor, small cards tilt
  // in 3D, and the hero picture shifts a little against the mouse for depth.
  mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const cleanups: Array<() => void> = [];
    const on = (el: Element, type: 'pointermove' | 'pointerleave', fn: (e: PointerEvent) => void) => {
      el.addEventListener(type, fn as EventListener);
      cleanups.push(() => el.removeEventListener(type, fn as EventListener));
    };

    document.querySelectorAll<HTMLElement>('main article').forEach((card) => {
      // Big feature blocks and the carousels (which animate their own cards) stay put.
      if (card.closest('[data-process-track], [aria-roledescription="carousel"]') || card.offsetWidth > 520) return;
      gsap.set(card, { transformPerspective: 900 });
      const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
      const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
      on(card, 'pointermove', (e) => {
        const r = card.getBoundingClientRect();
        rotY(((e.clientX - r.left) / r.width - 0.5) * 7);
        rotX(-((e.clientY - r.top) / r.height - 0.5) * 7);
      });
      on(card, 'pointerleave', () => {
        rotX(0);
        rotY(0);
      });
    });

    const hero = document.querySelector('[data-hero-copy]')?.closest('section');
    const media = hero?.querySelector('[data-hero-media]');
    if (hero && media) {
      const mx = gsap.quickTo(media, 'x', { duration: 1, ease: 'power3' });
      const my = gsap.quickTo(media, 'y', { duration: 1, ease: 'power3' });
      on(hero, 'pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mx(-((e.clientX - r.left) / r.width - 0.5) * 24);
        my(-((e.clientY - r.top) / r.height - 0.5) * 16);
      });
      on(hero, 'pointerleave', () => {
        mx(0);
        my(0);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  });

  // Scrollytelling: every card carousel (`[data-process-track]` — homepage services, and the
  // homepage/process/insurance phase cards) pins its section and walks through the cards as the page scrolls. Driving the
  // track's own scrollLeft keeps each component's counter, highlighted number and progress bar
  // in sync without touching its state. Cards already passed recede (dimmed, scaled down) so
  // the current step reads as the focus of the story.
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tracks = Array.from(document.querySelectorAll<HTMLElement>('main [data-process-track]'));
    const restores: Array<() => void> = [];

    tracks.forEach((track) => {
      const section = track.closest('section');
      if (!section) return;

      const distance = () => track.scrollWidth - track.clientWidth;
      if (distance() <= 0) return;

      const cards = Array.from(track.querySelectorAll<HTMLElement>('article'));
      const snapType = track.style.scrollSnapType;
      track.style.scrollSnapType = 'none';
      const state = { left: 0 };

      // How far hovering has lifted each card out of its dimmed resting state (0 to 1).
      const lifted = new Map(cards.map((card) => [card, { amount: 0 }]));

      // Where each card sits along the track, measured once (and again after a resize) so the
      // per-frame work below is plain arithmetic instead of a layout read for every card.
      let restLeft: number[] = [];
      let cardWidths: number[] = [];
      const measure = () => {
        const trackRect = track.getBoundingClientRect();
        const padding = parseFloat(getComputedStyle(track).paddingLeft);
        restLeft = cards.map((card) => card.getBoundingClientRect().left - trackRect.left - padding + track.scrollLeft);
        cardWidths = cards.map((card) => card.offsetWidth);
      };
      measure();
      // The cards are scaled and dimmed on every scroll frame: keep them on their own layers.
      cards.forEach((card) => {
        card.style.willChange = 'scale, filter';
      });

      const focusCards = () => {
        cards.forEach((card, index) => {
          const offset = (restLeft[index] - track.scrollLeft) / cardWidths[index];
          // 0 while the card is at or right of the focus line, → 1 once fully scrolled past it.
          const passed = gsap.utils.clamp(0, 1, -offset);
          // 0 on the focus line, → 1 a card's width ahead of it: the cards to come wait dimmed behind.
          const ahead = gsap.utils.clamp(0, 1, offset);
          const lift = lifted.get(card)?.amount ?? 0;
          const restingScale = (1 - passed * 0.06) * (0.94 + 0.06 * (1 - ahead));
          card.style.scale = String(restingScale + (1 - restingScale) * lift);
          const restingDim = (1 - passed * 0.5) * (0.7 + 0.3 * (1 - ahead));
          const dim = restingDim + (1 - restingDim) * lift;
          card.style.filter = dim < 0.999 ? `brightness(${dim}) saturate(${dim})` : '';
        });
      };

      focusCards();

      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        cards.forEach((card) => {
          const lift = lifted.get(card)!;
          const liftTo = (amount: number) => () =>
            gsap.to(lift, { amount, duration: 0.3, ease: 'power2.out', overwrite: true, onUpdate: focusCards });
          const enter = liftTo(1);
          const leave = liftTo(0);
          card.addEventListener('pointerenter', enter);
          card.addEventListener('pointerleave', leave);
          restores.push(() => {
            gsap.killTweensOf(lift);
            card.removeEventListener('pointerenter', enter);
            card.removeEventListener('pointerleave', leave);
          });
        });
      }

      const tween = gsap.to(state, {
        left: distance,
        ease: 'none',
        onUpdate: () => {
          track.scrollLeft = state.left;
          focusCards();
        },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance() * 1.4}`,
          pin: true,
          // GSAP skips pin spacing when the parent is a flex container (the process page's
          // <main>), which lets the sections below scroll up over the pinned one.
          pinSpacing: true,
          // Light scrub: the page is already eased by Lenis, a long scrub on top made the cards trail
          // the scroll and then lurch to a stop.
          scrub: 0.3,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            measure();
            focusCards();
          },
          // Created after the reveal triggers further down the page — refresh it first so their
          // start positions include the pin spacing.
          refreshPriority: 1,
        },
      });

      // The Previous / Next buttons step through the story by moving the PAGE to the neighbouring
      // card's scroll position. Left to scroll the track themselves they would be undone on the
      // next scroll tick, because the pin owns the track's position.
      const st = tween.scrollTrigger;
      section
        .querySelectorAll<HTMLButtonElement>('button[aria-label^="Previous"], button[aria-label^="Next"]')
        .forEach((button) => {
          if (!st) return;
          const direction = button.getAttribute('aria-label')?.startsWith('Next') ? 1 : -1;
          const onClick = (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
            const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
            const step = (cards[0]?.offsetWidth ?? track.clientWidth) + gap;
            const target = gsap.utils.clamp(0, distance(), (Math.round(state.left / step) + direction) * step);
            window.scrollTo({ top: st.start + (target / distance()) * (st.end - st.start), behavior: 'smooth' });
          };
          button.addEventListener('click', onClick, true);
          restores.push(() => button.removeEventListener('click', onClick, true));
        });

      restores.push(() => {
        track.style.scrollSnapType = snapType;
        cards.forEach((card) => {
          card.style.scale = '';
          card.style.filter = '';
          card.style.willChange = '';
        });
      });
    });

    return () => restores.forEach((restore) => restore());
  });
}
