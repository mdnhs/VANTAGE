'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { sizedSrc, type PublicImage } from '@/lib/media/public-image';

// Before / after in one frame: drag (or use the arrow keys) to wipe between the two photos.
// Fills its parent, which sets the size. A transparent range input covers the frame, so mouse,
// touch and keyboard dragging and the screen reader label all come from the browser; vertical
// swipes still scroll the page on a phone (touch-action: pan-y).
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
  const [position, setPosition] = useState(50);

  const photo = (image: PublicImage, label: string) => (
    <Image
      src={sizedSrc(image)}
      style={{ objectPosition: `${image.focal.x * 100}% ${image.focal.y * 100}%` }}
      alt={image.alt || `${alt}, ${label.toLowerCase()}`}
      fill
      sizes={sizes}
      priority={priority}
      draggable={false}
      className='object-cover select-none'
    />
  );

  return (
    <div className='absolute inset-0 z-10 overflow-hidden bg-black'>
      {photo(after, afterLabel)}
      <div className='absolute inset-0' style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {photo(before, beforeLabel)}
      </div>

      <span className='pointer-events-none absolute top-3 left-3 rounded-md bg-white/95 px-2.5 py-1.5 font-site-body text-[11px] leading-none font-medium text-[#1b1f26] sm:top-4 sm:left-4'>
        {beforeLabel}
      </span>
      <span className='pointer-events-none absolute top-3 right-3 rounded-md bg-white/95 px-2.5 py-1.5 font-site-body text-[11px] leading-none font-medium text-[#1b1f26] sm:top-4 sm:right-4'>
        {afterLabel}
      </span>

      <div
        aria-hidden
        className='pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]'
        style={{ left: `${position}%` }}
      >
        <span className='absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-[#1b1f26] shadow-md'>
          <ChevronLeft className='size-3.5 -mr-0.5' />
          <ChevronRight className='size-3.5 -ml-0.5' />
        </span>
      </div>

      <input
        type='range'
        min={0}
        max={100}
        step={0.5}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`Compare ${beforeLabel.toLowerCase()} and ${afterLabel.toLowerCase()} photos`}
        className='absolute inset-0 z-20 m-0 size-full cursor-ew-resize opacity-0 [touch-action:pan-y]'
      />
    </div>
  );
}
