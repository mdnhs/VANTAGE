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
    const copy = document.querySelector<HTMLElement>('[data-hero-copy]');
    const hero = copy?.closest('section');

    if (copy && hero) {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
      const [eyebrow, heading, ...rest] = Array.from(copy.children);
      intro
        .from(eyebrow, { autoAlpha: 0, y: -16, duration: 0.6 })
        .from(heading.children, { autoAlpha: 0, yPercent: 60, stagger: 0.12 }, '-=0.3')
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

      const media = hero.querySelector('video, img[fetchpriority]');
      if (media) {
        gsap.fromTo(
          media,
          { scale: 1.08 },
          {
            scale: 1,
            yPercent: 12,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
          },
        );
      }
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
          // 0 while the card is at or right of the focus line, → 1 once fully scrolled past it.
          const passed = gsap.utils.clamp(0, 1, (trackLeft - card.getBoundingClientRect().left) / card.offsetWidth);
          card.style.scale = String(1 - passed * 0.06);
          card.style.filter = passed > 0 ? `brightness(${1 - passed * 0.5}) saturate(${1 - passed * 0.5})` : '';
        });
      };

      gsap.to(state, {
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
          scrub: 0.6,
          invalidateOnRefresh: true,
          // Created after the reveal triggers further down the page — refresh it first so their
          // start positions include the pin spacing.
          refreshPriority: 1,
        },
      });

      restores.push(() => {
        track.style.scrollSnapType = snapType;
        cards.forEach((card) => {
          card.style.scale = '';
          card.style.filter = '';
        });
      });
    });

    return () => restores.forEach((restore) => restore());
  });
}
