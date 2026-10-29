'use client';

import { useLayoutEffect, useRef, useState } from 'react';

// The 4px active bar on the panel's left edge. One bar for the whole menu: on a route change it
// slides from the old item to the new one, across groups (the OpsDesk sidebar). It measures the
// current link inside its parent, which must be positioned. The first placement and any
// re-measure (resize, icon rail) jump; only a route change slides.
export function NavIndicator({ pathname }: { pathname: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [top, setTop] = useState<number | null>(null);
  const [slide, setSlide] = useState(false);
  const lastPath = useRef(pathname);

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const measure = () => {
      const link = parent.querySelector<HTMLElement>('[aria-current="page"]');
      if (!link) return setTop(null);
      const box = link.getBoundingClientRect();
      setTop(box.top - parent.getBoundingClientRect().top + box.height / 2);
    };
    setSlide(lastPath.current !== pathname);
    lastPath.current = pathname;
    measure();
    const observer = new ResizeObserver(() => {
      setSlide(false);
      measure();
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <span
      ref={ref}
      aria-hidden
      style={{ transform: `translateY(calc(${top ?? 0}px - 50%))` }}
      className={`pointer-events-none absolute top-0 left-0 h-8 w-1 rounded-r-full bg-primary ${
        top === null ? 'opacity-0' : ''
      } ${slide ? 'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)]' : ''}`}
    />
  );
}
