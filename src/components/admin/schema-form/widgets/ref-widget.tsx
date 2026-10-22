'use client';

import { useId } from 'react';

import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { type ImageRef, type VideoRef } from '@/lib/content/image-ref';

import { describedBy, WidgetShell, type WidgetProps } from './shell';

type Ref = ImageRef | VideoRef;

// Shared by the image and video widgets: wraps CloudinaryUpload and stores a
// `{ kind: 'cloudinary', publicId }` ref (or null). A `media` ref (Phase 5)
// has no preview here yet; it is shown as a note and can be replaced.
export function RefWidget({
  field,
  value,
  onChange,
  error,
  mode,
  defaultFolder,
}: WidgetProps<Ref | undefined> & {
  mode: 'single-image' | 'video';
  defaultFolder: string;
}) {
  const id = useId();
  const current = value ?? null;
  return (
    <WidgetShell id={id} field={field} error={error}>
      <div id={id} aria-describedby={describedBy(id, field, error)}>
        {current?.kind === 'media' ? (
          <div className='flex items-center gap-3 text-sm text-muted-foreground'>
            <span>Media library item</span>
            <button type='button' className='underline underline-offset-2' onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        ) : (
          <CloudinaryUpload
            mode={mode}
            folder={field.folder ?? defaultFolder}
            value={current?.publicId ?? null}
            onChange={(next) =>
              onChange(typeof next === 'string' && next ? { kind: 'cloudinary', publicId: next } : null)
            }
          />
        )}
      </div>
    </WidgetShell>
  );
}
