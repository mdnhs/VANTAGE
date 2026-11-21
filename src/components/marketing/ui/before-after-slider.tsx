'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { sizedSrc, type PublicImage } from '@/lib/media/public-image';

const INTRO_MS = 2200;

// Before / after in one frame: drag (or use the arrow keys) to wipe between the two photos.
// Fills its parent, which sets the size. A transparent range input covers the frame, so mouse,
// touch and keyboard dragging and the screen reader label all come from the browser; vertical
// swipes still scroll the page on a phone (touch-action: pan-y).
//
// When it first scrolls into view the divider sweeps across once to show it can be dragged,
// until the visitor takes over. The handle pulses until then.
export function BeforeAfterSlider({
  before,
  after,
  alt,
  sizes,
  beforeLabel = 'Before',
  afterLabel = 'After',
  priority = false,
}: {
  before: PublicImage;
  after: PublicImage;
  alt: string;
  sizes: string;
  beforeLabel?: string;
  afterLabel?: string;
  priority?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const frameId = useRef(0);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);

  const stopIntro = () => cancelAnimationFrame(frameId.current);
  const take = () => {
    stopIntro();
    setTouched(true);
  };

  // The intro sweep: out to one side, across to the other, back to the middle.
  useEffect(() => {
    const node = frame.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / INTRO_MS);
          setPosition(50 + 26 * Math.sin(t * Math.PI * 2) * (1 - t * 0.35));
          if (t < 1) frameId.current = requestAnimationFrame(tick);
          else setPosition(50);
        };
        frameId.current = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId.current);
    };
  }, []);

  // A drag that ends outside the frame still ends.
  useEffect(() => {
    if (!dragging) return;
    const end = () => setDragging(false);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [dragging]);

  const photo = (image: PublicImage, label: string, className = '') => (
    <Image
      src={sizedSrc(image)}
      style={{ objectPosition: `${image.focal.x * 100}% ${image.focal.y * 100}%` }}
      alt={image.alt || `${alt}, ${label.toLowerCase()}`}
      fill
      sizes={sizes}
      priority={priority}
      draggable={false}
      className={`object-cover select-none ${className}`}
    />
  );

  const pill =
    'pointer-events-none absolute top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 font-site-body text-[10px] leading-none font-semibold tracking-[0.12em] text-white uppercase shadow-lg backdrop-blur-md transition-opacity duration-300 sm:top-4 sm:text-[11px]';

  return (
    <div ref={frame} className='absolute inset-0 z-10 overflow-hidden bg-black'>
      {photo(after, afterLabel)}
      <div className='absolute inset-0' style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {/* The "before" photo is a touch duller, so the repair reads as the difference. */}
        {photo(before, beforeLabel, 'brightness-[0.9] saturate-[0.8]')}
      </div>

      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent' />

      <span
        className={`${pill} left-3 sm:left-4`}
        style={{ opacity: position < 16 ? 0 : 1 }}
      >
        <span className='size-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]' />
        {beforeLabel}
      </span>
      <span
        className={`${pill} right-3 sm:right-4`}
        style={{ opacity: position > 84 ? 0 : 1 }}
      >
        <span className='size-1.5 rounded-full bg-[#00d492] shadow-[0_0_8px_#00d492]' />
        {afterLabel}
      </span>

      {/* Divider and handle */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-white/30 via-white to-white/30 shadow-[0_0_14px_rgb(var(--brand-rgb)/0.9)]'
        style={{ left: `${position}%` }}
      >
        <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          {!touched && <span className='absolute inset-0 animate-ping rounded-full bg-brand/60' />}
          <span
            className={`relative flex size-11 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-[0_6px_24px_rgb(var(--brand-rgb)/0.65)] transition-transform duration-200 ${
              dragging ? 'scale-110' : 'scale-100'
            }`}
          >
            <ChevronLeft className='-mr-1 size-4' strokeWidth={3} />
            <ChevronRight className='-ml-1 size-4' strokeWidth={3} />
          </span>
        </span>
      </div>

      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-3 flex justify-center font-site-body text-[10px] tracking-[0.14em] text-white/85 uppercase transition-opacity duration-500 sm:bottom-4 ${
          touched ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className='rounded-full border border-white/15 bg-black/45 px-3 py-1.5 backdrop-blur-md'>
          Drag to compare
        </span>
      </span>

      <input
        type='range'
        min={0}
        max={100}
        step={0.5}
        value={position}
        onChange={(e) => {
          take();
          setPosition(Number(e.target.value));
        }}
        onPointerDown={() => {
          take();
          setDragging(true);
        }}
        onKeyDown={take}
        aria-label={`Compare ${beforeLabel.toLowerCase()} and ${afterLabel.toLowerCase()} photos`}
        className='absolute inset-0 z-20 m-0 size-full cursor-ew-resize opacity-0 [touch-action:pan-y]'
      />
    </div>
  );
}
