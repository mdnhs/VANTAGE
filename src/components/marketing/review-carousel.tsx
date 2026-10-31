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
    'flex size-11 items-center justify-center rounded-full border border-[#2a2a30] bg-[#1b1b20] text-white transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className='flex flex-col gap-8'>
      <div
        ref={trackRef}
        onScroll={measure}
        tabIndex={0}
        role='region'
        aria-roledescription='carousel'
        aria-label='Customer reviews'
        className='flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto scroll-smooth pb-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [&::-webkit-scrollbar]:hidden [&>*]:w-full [&>*]:shrink-0 [&>*]:snap-start md:[&>*]:w-[calc((100%-1.5rem)/2)] lg:[&>*]:w-[calc((100%-3rem)/3)]'
      >
        {children}
      </div>

      {pages > 1 && (
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2' role='group' aria-label='Choose review'>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type='button'
                onClick={() => goTo(i)}
                aria-label={`Show review ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand' : 'w-2 bg-[#3a3a42] hover:bg-[#5a5a64]'}`}
              />
            ))}
          </div>
          <div className='flex items-center gap-3'>
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
