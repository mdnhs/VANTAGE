'use client';

import { useId } from 'react';

import { MediaField } from '@/features/media/components/media-field';
import { type ImageRef } from '@/lib/content/image-ref';

import { describedBy, GroupShell, type WidgetProps } from './shell';

export function ImageWidget({ field, value, onChange, error }: WidgetProps<ImageRef | undefined>) {
  const id = useId();
  return (
    <GroupShell id={id} field={field} error={error}>
      {/* Image and video refs are always nullable schemas. */}
      <MediaField
        kind='image'
        label={field.label}
        value={value}
        nullable
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, field, error)}
        onChange={onChange}
      />
    </GroupShell>
  );
}
