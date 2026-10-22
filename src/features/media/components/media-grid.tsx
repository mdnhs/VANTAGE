'use client';

import { FileTextIcon, FilmIcon } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

import type { MediaItem } from '../types';

// One file as a square thumbnail: image (cropped around its focal point),
// video, or PDF icon.
export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  const frame = cn(
    'relative flex aspect-square w-full items-center justify-center overflow-hidden bg-muted',
    className,
  );
  if (item.mimeType.startsWith('image/')) {
    return (
      <span className={frame}>
        <Image
          src={item.url}
          alt={item.alt}
          fill
          sizes='(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 50vw'
          className='object-cover'
          style={{ objectPosition: `${item.focalX * 100}% ${item.focalY * 100}%` }}
        />
      </span>
    );
  }
  const Icon = item.mimeType.startsWith('video/') ? FilmIcon : FileTextIcon;
  return (
    <span className={frame}>
      <Icon className='size-10 text-muted-foreground' aria-hidden />
    </span>
  );
}

export function MediaGrid({ items, onOpen }: { items: MediaItem[]; onOpen(item: MediaItem): void }) {
  return (
    <ul className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
      {items.map((item) => {
        const needsAlt = item.mimeType.startsWith('image/') && !item.alt && !item.isDecorative;
        return (
          <li key={item.id}>
            <button
              type='button'
              onClick={() => onOpen(item)}
              className='flex w-full flex-col gap-2 rounded-xl border bg-card p-2 text-left text-sm hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50'
            >
              <MediaThumb item={item} className='rounded-lg' />
              <span className='truncate font-medium'>{item.filename}</span>
              {needsAlt ? <span className='text-xs text-amber-700 dark:text-amber-400'>Needs alt text</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
