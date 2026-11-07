'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

gsap.registerPlugin(ScrollTrigger);

// GSAP motion for every marketing page, applied over the server-rendered sections without
// wiring refs into each one: a hero intro timeline (`[data-hero-copy]`), a slow hero-media
// parallax, and scroll reveals for every later section's heading block and cards.
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
    const isReady = () => Boolean(document.querySelector('main section'));
    const start = () => {
      ctx = gsap.context(setup);
      ScrollTrigger.refresh();
    };

    if (isReady()) {
      start();
      return () => ctx?.revert();
    }

    const observer = new MutationObserver(() => {
      if (!isReady()) return;
      observer.disconnect();
      start();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}

function setup() {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    let clipped: HTMLElement | null = null;
    const copy = document.querySelector<HTMLElement>('[data-hero-copy]');
    const hero = copy?.closest('section');

    if (copy && hero) {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
      const [eyebrow, heading, ...rest] = Array.from(copy.children);
      intro
        .from(eyebrow, { autoAlpha: 0, y: -16, duration: 0.6 })
        .from(
          heading.children,
          {
            autoAlpha: 0,
            yPercent: 110,
            rotate: 2.5,
            transformOrigin: '0% 100%',
            stagger: 0.14,
            duration: 1.05,
            ease: 'power4.out',
            // Each line rises out of a mask; the clip comes off afterwards so nothing stays cut.
            onStart: () => {
              clipped = heading as HTMLElement;
              clipped.style.overflow = 'hidden';
            },
            onComplete: () => {
              if (clipped) clipped.style.overflow = '';
            },
          },
          '-=0.3',
        )
        .from(rest, { autoAlpha: 0, y: 24, stagger: 0.12 }, '-=0.55');

      const trust = hero.querySelector('[data-hero-trust]');
      if (trust) intro.from(trust.children, { autoAlpha: 0, y: 20, stagger: 0.08, duration: 0.6 }, '-=0.4');

      // Scrollytelling: the hero copy drifts up and dissolves as the page takes over.
      gsap.to(copy, {
        y: -120,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: true },
      });

      const media = hero.querySelector('[data-hero-media]');
      if (media) {
        gsap.fromTo(
          media,
          { scale: 1.08 },
          {
            scale: 1.04,
            yPercent: 12,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
          },
        );
      }
    }

    // The "scroll" cue under a full-screen hero: a line that draws and wipes, gone once the page moves.
    const cue = hero?.querySelector<HTMLElement>('[data-scroll-cue]');
    const cueLine = cue?.querySelector<HTMLElement>('[data-cue-line]');
    if (hero && cue) {
      if (cueLine) {
        gsap
          .timeline({ repeat: -1, repeatDelay: 0.15, defaults: { duration: 0.9, ease: 'power2.inOut' } })
          .fromTo(cueLine, { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1 })
          .set(cueLine, { transformOrigin: '50% 100%' })
          .to(cueLine, { scaleY: 0 });
      }
      gsap.to(cue, {
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=140', scrub: true },
      });
    }

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
        const headingBlock = [heading.previousElementSibling, heading, ...intro].filter(
          (el): el is Element => Boolean(el) && !el!.closest('article, form'),
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

    return () => {
      if (clipped) clipped.style.overflow = '';
    };
  });

  // Reading aids: a progress line along the top edge, big step numbers that drift against the
  // scroll, and body copy that lights up word by word as it is read. Everything is restored on
  // cleanup, and the words stay in the DOM at partial opacity so crawlers and readers see them.
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const cleanups: Array<() => void> = [];

    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText =
      'position:fixed;top:0;left:0;right:0;height:3px;z-index:45;pointer-events:none;transform-origin:0 50%;transform:scaleX(0);background:rgb(var(--brand-rgb))';
    document.body.appendChild(bar);
    cleanups.push(() => bar.remove());
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.25 } });

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

    document.querySelectorAll<HTMLElement>('main a.bg-brand, section#contact a.bg-brand').forEach((button) => {
      const xTo = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3' });
      on(button, 'pointermove', (e) => {
        const r = button.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      on(button, 'pointerleave', () => {
        xTo(0);
        yTo(0);
      });
    });

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

      const focusCards = () => {
        const trackLeft = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
        cards.forEach((card) => {
          const offset = (card.getBoundingClientRect().left - trackLeft) / card.offsetWidth;
          // 0 while the card is at or right of the focus line, → 1 once fully scrolled past it.
          const passed = gsap.utils.clamp(0, 1, -offset);
          // 0 on the focus line, → 1 a card's width ahead of it: the cards to come wait dimmed behind.
          const ahead = gsap.utils.clamp(0, 1, offset);
          const focus = 1 - Math.max(passed, ahead);
          card.style.scale = String((1 - passed * 0.06) * (0.94 + 0.06 * (1 - ahead)));
          const dim = (1 - passed * 0.5) * (0.7 + 0.3 * (1 - ahead));
          card.style.filter = dim < 0.999 ? `brightness(${dim}) saturate(${dim})` : '';
          // The card in focus gets a soft brand ring and glow.
          card.style.boxShadow =
            focus > 0.01
              ? `0 0 0 1px rgb(var(--brand-rgb) / ${0.5 * focus}), 0 24px 60px -24px rgb(var(--brand-rgb) / ${0.4 * focus})`
              : '';
        });
      };

      focusCards();

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
          scrub: 0.6,
          invalidateOnRefresh: true,
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
          card.style.boxShadow = '';
        });
      });
    });

    return () => restores.forEach((restore) => restore());
  });
}
