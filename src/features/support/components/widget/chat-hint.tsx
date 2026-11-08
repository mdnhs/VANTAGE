'use client';

import { gsap } from 'gsap';
import { X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const OPTIONS = [
  { label: 'Get a repair estimate', draft: "I'd like a repair estimate." },
  { label: 'Help with an insurance claim', draft: 'I need help with an insurance claim.' },
  { label: 'Ask something else', draft: '' },
];

const ENTRANCE_DELAY_S = 0.5;
const COLLAPSE_DELAY_MS = 320;
const CLOSING_CIRCLE_RADIUS = 22;
// A pill the same height as the round chat button beside it; opening only makes it taller.
const PILL_RADIUS = 32;
const CLIPPED = `inset(0% 0% 0% 100% round ${PILL_RADIUS}px)`;
const REVEALED = `inset(0% 0% 0% 0% round ${PILL_RADIUS}px)`;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchOnly = () => window.matchMedia('(hover: none)').matches;

export function ChatHint({
  online,
  skipEntrance,
  onEntered,
  onOpen,
  onGone,
}: {
  online: boolean;
  skipEntrance: boolean;
  onEntered: () => void;
  onOpen: (draft?: string) => void;
  onGone: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLSpanElement>(null);
  const sheen = useRef<HTMLSpanElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const trayTimeline = useRef<gsap.core.Timeline | null>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hovering = useRef(false);
  const pressing = useRef(false);
  const playEntrance = useRef(!skipEntrance);
  const announceEntered = useRef(onEntered);

  // A single pass of red across the panel, the way a spray gun crosses a body panel.
  useLayoutEffect(() => {
    const card = root.current;
    if (!card || !playEntrance.current || reducedMotion()) return;
    const context = gsap.context(() => {
      gsap
        .timeline({ delay: ENTRANCE_DELAY_S, onStart: () => announceEntered.current() })
        .fromTo(
          card,
          { clipPath: CLIPPED },
          { clipPath: REVEALED, duration: 0.7, ease: 'power4.inOut', clearProps: 'clipPath' },
        )
        .fromTo(
          band.current,
          { xPercent: 100, opacity: 1 },
          { xPercent: -101, opacity: 1, duration: 0.85, ease: 'power3.inOut' },
          0,
        )
        .fromTo(
          card.querySelectorAll('[data-hint-rise]'),
          { yPercent: 110 },
          { yPercent: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'all' },
          0.42,
        );
    }, card);
    return () => context.revert();
  }, []);

  useLayoutEffect(() => {
    const panel = tray.current;
    if (!panel) return;
    const timeline = gsap
      .timeline({ paused: true })
      .fromTo(panel, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.4, ease: 'power3.inOut' })
      .fromTo(
        panel.querySelectorAll('li'),
        { x: 18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' },
        0.12,
      );
    trayTimeline.current = timeline;
    return () => {
      timeline.kill();
      trayTimeline.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const timeline = trayTimeline.current;
    if (!timeline) return;
    if (reducedMotion()) timeline.progress(expanded ? 1 : 0);
    else if (expanded) timeline.timeScale(1).play();
    else timeline.timeScale(1.5).reverse();
  }, [expanded]);

  // The surface behaves like fresh clearcoat: light follows the pointer and the panel leans into it.
  useEffect(() => {
    const card = root.current;
    const light = sheen.current;
    if (!card || !light) return;
    const mm = gsap.matchMedia();
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      gsap.set(card, { transformPerspective: 800, transformOrigin: '100% 100%' });
      const tiltX = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power3' });
      const tiltY = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power3' });
      const move = (event: PointerEvent) => {
        const box = card.getBoundingClientRect();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        light.style.setProperty('--sheen-x', `${x}px`);
        light.style.setProperty('--sheen-y', `${y}px`);
        tiltY((x / box.width - 0.5) * 7);
        tiltX((0.5 - y / box.height) * 6);
      };
      const enter = () => gsap.to(light, { opacity: 1, duration: 0.3, overwrite: 'auto' });
      const leave = () => {
        gsap.to(light, { opacity: 0, duration: 0.45, overwrite: 'auto' });
        tiltX(0);
        tiltY(0);
      };
      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
      return () => {
        card.removeEventListener('pointerenter', enter);
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerleave', leave);
      };
    });
    return () => {
      mm.revert();
      clearTimeout(collapseTimer.current);
    };
  }, []);

  // A tap elsewhere folds the options away; touch screens have no pointer to leave.
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [expanded]);

  const expandNow = () => {
    clearTimeout(collapseTimer.current);
    setExpanded(true);
  };

  // The panel closes in on the spot that was clicked, holds there as a small circle, then goes.
  const dismiss = (event: React.MouseEvent<HTMLButtonElement>) => {
    const card = root.current;
    if (!card || reducedMotion()) return onGone();
    const box = card.getBoundingClientRect();
    const button = event.currentTarget.getBoundingClientRect();
    // A keyboard press has no pointer position (detail is 0), so it closes on the button itself.
    const clientX = event.detail ? event.clientX : button.left + button.width / 2;
    const clientY = event.detail ? event.clientY : button.top + button.height / 2;
    const x = Math.round(clientX - box.left);
    const y = Math.round(clientY - box.top);
    const circle = (radius: number) => `circle(${radius}px at ${x}px ${y}px)`;
    const covers = Math.ceil(Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)));

    gsap.set(card, { pointerEvents: 'none' });
    gsap
      .timeline({ onComplete: onGone })
      .fromTo(
        card,
        { clipPath: circle(covers) },
        { clipPath: circle(CLOSING_CIRCLE_RADIUS), duration: 0.34, ease: 'power3.inOut', overwrite: 'auto' },
      )
      .to(card, { clipPath: circle(0), duration: 0.16, ease: 'power2.in' }, '+=0.04');
  };

  return (
    <div
      ref={root}
      role='group'
      aria-label='Chat options'
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        hovering.current = true;
        expandNow();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return;
        hovering.current = false;
        collapseTimer.current = setTimeout(() => {
          if (!root.current?.contains(document.activeElement)) setExpanded(false);
        }, COLLAPSE_DELAY_MS);
      }}
      onPointerDownCapture={() => {
        pressing.current = true;
      }}
      onPointerUpCapture={() => {
        pressing.current = false;
      }}
      onFocusCapture={() => {
        // A tap focuses the button after pointerup and before click, so touch screens are left to the click.
        if (!pressing.current && !touchOnly()) expandNow();
      }}
      onBlurCapture={(event) => {
        if (!hovering.current && !root.current?.contains(event.relatedTarget as Node | null)) setExpanded(false);
      }}
      className='relative w-[min(272px,calc(100vw-108px))] overflow-hidden rounded-[32px] border border-white/14 bg-[#17171a] text-white shadow-[0_18px_50px_-12px_rgb(0_0_0/0.8)] will-change-transform'
    >
      <span
        ref={sheen}
        aria-hidden
        className='pointer-events-none absolute inset-0 z-10 opacity-0 [background:radial-gradient(240px_150px_at_var(--sheen-x,50%)_var(--sheen-y,50%),rgb(255_255_255/0.15),transparent_72%)]'
      />
      <span ref={band} aria-hidden className='pointer-events-none absolute inset-0 z-20 bg-brand opacity-0' />

      <div ref={tray} className='h-0 overflow-hidden'>
        <ul className='border-b border-white/10 px-2 pt-3 pb-1.5'>
          {OPTIONS.map((option) => (
            <li key={option.label}>
              <button
                type='button'
                onClick={() => onOpen(option.draft)}
                className='group/option relative flex min-h-11 w-full cursor-pointer items-center overflow-hidden rounded-full px-4 text-left text-[14px] text-white/85 outline-none hover:text-white focus-visible:text-white'
              >
                <span
                  aria-hidden
                  className='absolute inset-0 origin-left scale-x-0 bg-brand transition-transform duration-300 ease-out group-hover/option:scale-x-100 group-focus-visible/option:scale-x-100 motion-reduce:transition-none'
                />
                <span className='relative'>{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className='relative flex items-center'>
        <button
          type='button'
          aria-label='How can we help?'
          aria-expanded={expanded}
          // Only an option opens the chat. A tap toggles, as a touch screen has no pointer to leave.
          onClick={() => setExpanded((open) => (touchOnly() ? !open : true))}
          className='min-h-[62px] min-w-0 flex-1 cursor-pointer py-2 pr-1 pl-6 text-left outline-none focus-visible:bg-white/[0.06]'
        >
          <span className='block overflow-hidden'>
            <span
              data-hint-rise
              className='flex items-center gap-2 font-site-heading text-[16px] leading-6 font-semibold tracking-[-0.01em]'
            >
              {online ? <span aria-hidden className='size-2 shrink-0 rounded-full bg-emerald-500' /> : null}
              How can we help?
            </span>
          </span>
          <span className='block overflow-hidden'>
            <span data-hint-rise className='block text-[13px] leading-5 text-white/60'>
              A scratch, a dent or a claim?
            </span>
          </span>
        </button>
        <button
          type='button'
          onClick={dismiss}
          aria-label='Hide this message'
          className='mr-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-white/45 outline-none hover:text-white focus-visible:text-white'
        >
          <X className='size-4' aria-hidden />
        </button>
      </div>
    </div>
  );
}
