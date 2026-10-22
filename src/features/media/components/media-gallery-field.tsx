'use client';

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { useMediaByIds } from '../hooks/use-media';
import { MediaThumb } from './media-grid';
import { MediaPickerDialog } from './media-picker-dialog';

// An ordered list of images (e.g. a project gallery): add through the picker
// until `max`, remove, move up or down.
export function MediaGalleryField({
  value,
  onChange,
  max,
  label,
}: {
  value: string[];
  onChange(ids: string[]): void;
  max: number;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const found = useMediaByIds(value);
  const byId = new Map((found.data ?? []).map((item) => [item.id, item]));

  const move = (index: number, by: -1 | 1) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item!);
    onChange(next);
  };

  return (
    <div className='flex flex-col gap-3'>
      {value.length > 0 ? (
        <ul className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {value.map((id, index) => {
            const item = byId.get(id);
            return (
              <li key={id} className='flex flex-col gap-1 rounded-xl border p-1'>
                {item ? (
                  <MediaThumb item={item} className='rounded-lg' />
                ) : (
                  <span className='aspect-square w-full rounded-lg bg-muted' />
                )}
                <div className='flex items-center justify-between'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    disabled={index === 0}
                    aria-label={`Move ${label} ${index + 1} up`}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUpIcon className='size-3.5' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    disabled={index === value.length - 1}
                    aria-label={`Move ${label} ${index + 1} down`}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownIcon className='size-3.5' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    aria-label={`Remove ${label} ${index + 1}`}
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                  >
                    <XIcon className='size-3.5' />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className='flex items-center gap-3'>
        <Button type='button' variant='outline' disabled={value.length >= max} onClick={() => setOpen(true)}>
          <PlusIcon className='size-4' /> Add images
        </Button>
        <span className='text-xs text-muted-foreground'>
          {value.length}/{max}
        </span>
      </div>
      {open ? (
        <MediaPickerDialog
          open={open}
          onOpenChange={setOpen}
          kind='image'
          multiple
          selectedIds={value}
          onPick={(item) => {
            if (value.length >= max || value.includes(item.id)) return;
            onChange([...value, item.id]);
          }}
        />
      ) : null}
    </div>
  );
}
