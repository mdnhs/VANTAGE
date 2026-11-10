'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

// Scroll-snap track: 1 card on phones, 2 on tablets, 3 on desktop. The arrows and dots only
// appear when the cards do not all fit, and the track stays swipeable and keyboard-scrollable.
export function ReviewCarousel({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ index: 0, pages: 1 });
  const count = Children.count(children);

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

  const goTo = (index: number) => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
    track.scrollTo({ left: index * step, behavior: 'smooth' });
  };

  const { index, pages } = state;
  const arrow =
    'flex size-11 items-center justify-center rounded-full border border-[#353c47] bg-[#262b34] text-[#f1f3f6] transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className='flex flex-col gap-4 sm:gap-8'>
      <div
        ref={trackRef}
        onScroll={measure}
        tabIndex={0}
        role='region'
        aria-roledescription='carousel'
        aria-label='Customer reviews'
        className='flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto scroll-smooth pb-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand max-sm:-mx-5 max-sm:scroll-px-5 max-sm:px-5 sm:gap-6 [&::-webkit-scrollbar]:hidden [&>*]:w-[300px] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-full md:[&>*]:w-[calc((100%-1.5rem)/2)] lg:[&>*]:w-[calc((100%-3rem)/3)]'
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
