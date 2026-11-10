'use client';

import { useEffect, useState } from 'react';

interface ScrollDotsProps {
  /** id of the horizontally scrolling element the dots mirror. */
  targetId: string;
  count: number;
}

// Mobile-only pagination dots (red active, grey inactive) driven by the carousel's scroll position.
export function ScrollDots({ targetId, count }: ScrollDotsProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setActive(max > 0 ? Math.round((el.scrollLeft / max) * (count - 1)) : 0);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [targetId, count]);

  if (count < 2) return null;

  return (
    <div aria-hidden className='flex items-center justify-center gap-2 sm:hidden'>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-5 bg-brand' : 'w-1.5 bg-[#4e5663]'}`}
        />
      ))}
    </div>
  );
}
