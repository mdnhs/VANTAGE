'use client';

import { FilmIcon, ImageIcon } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { ImageRef, VideoRef } from '@/lib/content/image-ref';

import { useMediaByIds } from '../hooks/use-media';
import type { MediaKind } from '../types';
import { MediaThumb } from './media-grid';
import { MediaPickerDialog } from './media-picker-dialog';

// One image or video slot: a thumbnail, Choose/Change, and Remove when the slot
// may be empty. A leftover Cloudinary ref is shown as legacy until replaced.
export function MediaField({
  value,
  onChange,
  kind,
  label,
  nullable = false,
  disabled = false,
  ...aria
}: {
  value: ImageRef | VideoRef | undefined;
  onChange(value: { kind: 'media'; id: string } | null): void;
  kind: MediaKind;
  label: string;
  nullable?: boolean;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const mediaId = value?.kind === 'media' ? value.id : null;
  const found = useMediaByIds(mediaId ? [mediaId] : []);
  const current = found.data?.[0];
  const hasValue = Boolean(mediaId);
  const Placeholder = kind === 'video' ? FilmIcon : ImageIcon;
  return (
    <div className='flex items-center gap-3'>
      <div className='flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted'>
        {current ? <MediaThumb item={current} /> : <Placeholder aria-hidden className='size-6 text-muted-foreground' />}
      </div>
      <div className='flex flex-col items-start gap-2'>
        <div className='flex gap-2'>
          <Button
            id={id}
            type='button'
            variant='outline'
            disabled={disabled}
            aria-label={`${hasValue ? 'Change' : 'Choose'} ${label} ${kind}`}
            {...aria}
            onClick={() => setOpen(true)}
          >
            {hasValue ? `Change ${kind}` : `Choose ${kind}`}
          </Button>
          {nullable && hasValue ? (
            <Button
              type='button'
              variant='ghost'
              disabled={disabled}
              aria-label={`Remove ${label} ${kind}`}
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {open ? (
        <MediaPickerDialog
          open={open}
          onOpenChange={setOpen}
          kind={kind}
          selectedId={mediaId}
          onPick={(item) => onChange({ kind: 'media', id: item.id })}
        />
      ) : null}
    </div>
  );
}
