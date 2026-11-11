'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { animate, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { Children, useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

// Scroll-snap track: 1 card on phones, 2 on tablets, 3 on desktop. The arrows and dots only
// appear when the cards do not all fit, and the track stays swipeable and keyboard-scrollable.
export function ReviewCarousel({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ index: 0, pages: 1 });
  const count = Children.count(children);
  const reduceMotion = useReducedMotion();
  const glide = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef<{ startX: number; startScroll: number; lastX: number; lastT: number; velocity: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
    const perView = Math.max(1, Math.round((track.clientWidth + 1) / step));
    const pages = Math.max(1, count - perView + 1);
    setState({ index: Math.min(pages - 1, Math.round(track.scrollLeft / step)), pages });
  }, [count]);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  const stepWidth = () => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return 0;
    return first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
  };

  // Glides to a card with a spring. Scroll-snap is switched off while it runs (it would fight the
  // animation frame by frame) and handed back once the track has settled.
  const goTo = (index: number) => {
    const track = trackRef.current;
    const step = stepWidth();
    if (!track || !step) return;
    glide.current?.stop();
    const target = Math.max(0, index) * step;
    if (reduceMotion) {
      track.scrollTo({ left: target });
      return;
    }
    track.style.scrollSnapType = 'none';
    glide.current = animate(track.scrollLeft, target, {
      type: 'spring',
      stiffness: 210,
      damping: 28,
      onUpdate: (value) => {
        track.scrollLeft = value;
      },
      onComplete: () => {
        track.style.scrollSnapType = '';
      },
    });
  };

  // Mouse drag with momentum: the card nearest to where the throw would land becomes the target.
  // Touch keeps the browser's own swipe and snapping.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || event.pointerType !== 'mouse' || event.button !== 0) return;
    glide.current?.stop();
    track.style.scrollSnapType = 'none';
    drag.current = {
      startX: event.clientX,
      startScroll: track.scrollLeft,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const d = drag.current;
    if (!track || !d) return;
    if (!dragging && Math.abs(event.clientX - d.startX) > 4) {
      setDragging(true);
      track.setPointerCapture(event.pointerId);
    }
    track.scrollLeft = d.startScroll - (event.clientX - d.startX);
    const dt = Math.max(1, event.timeStamp - d.lastT);
    d.velocity = (event.clientX - d.lastX) / dt;
    d.lastX = event.clientX;
    d.lastT = event.timeStamp;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const d = drag.current;
    drag.current = null;
    if (!track || !d) return;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    setDragging(false);
    const step = stepWidth();
    if (!step) return;
    const thrown = track.scrollLeft - d.velocity * 220;
    goTo(Math.min(state.pages - 1, Math.max(0, Math.round(thrown / step))));
  };

  const { index, pages } = state;
  const arrow =
    'flex size-11 items-center justify-center rounded-full border border-[#353c47] bg-[#262b34] text-[#f1f3f6] transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className='flex flex-col gap-4 sm:gap-8'>
      <div
        ref={trackRef}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        tabIndex={0}
        role='region'
        aria-roledescription='carousel'
        aria-label='Customer reviews'
        className={`-mt-2 -mb-7 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto pt-2 pb-8 sm:cursor-grab ${dragging ? 'cursor-grabbing select-none' : ''} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand max-sm:-mx-5 max-sm:scroll-px-5 max-sm:px-5 sm:gap-6 [&::-webkit-scrollbar]:hidden [&>*]:w-[300px] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-full md:[&>*]:w-[calc((100%-1.5rem)/2)] lg:[&>*]:w-[calc((100%-3rem)/3)]`}
      >
        {children}
      </div>

      {pages > 1 && (
        <div className='flex items-center justify-center gap-4 sm:justify-between'>
          <div className='flex items-center gap-1.5 sm:gap-2' role='group' aria-label='Choose review'>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type='button'
                onClick={() => goTo(i)}
                aria-label={`Show review ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all sm:h-2 ${i === index ? 'w-[22px] bg-brand sm:w-6' : 'w-1.5 bg-[#4e5663] hover:bg-[#525a67] sm:w-2 sm:bg-[#3e4551]'}`}
              />
            ))}
          </div>
          <div className='hidden items-center gap-3 sm:flex'>
            <button
              type='button'
              className={arrow}
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label='Previous reviews'
            >
              <ChevronLeft className='size-5' />
            </button>
            <button
              type='button'
              className={arrow}
              onClick={() => goTo(index + 1)}
              disabled={index >= pages - 1}
              aria-label='Next reviews'
            >
              <ChevronRight className='size-5' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
