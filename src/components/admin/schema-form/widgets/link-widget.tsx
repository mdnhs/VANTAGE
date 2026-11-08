'use client';

import { useId } from 'react';
import { Controller, type Control, type FieldValues } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import type { FormField } from '../to-fields';

// Any /path, #anchor, https:, mailto: or tel: is accepted (Href).
// `compact` is for a row inside a list that already titles it: just the two inputs, side by side.
export function LinkWidget({
  field,
  control,
  compact = false,
}: {
  field: FormField;
  control: Control<FieldValues>;
  compact?: boolean;
}) {
  const id = useId();
  const part = (key: 'label' | 'href', label: string) => (
    <Controller
      name={`${field.name}.${key}`}
      control={control}
      render={({ field: input, fieldState }) => (
        <Field data-invalid={fieldState.error ? true : undefined}>
          <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
          <Input
            id={`${id}-${key}`}
            name={input.name}
            ref={input.ref}
            value={input.value ?? ''}
            onBlur={input.onBlur}
            onChange={(event) => input.onChange(event.target.value)}
            placeholder={key === 'href' ? '/contact, #faq or https://…' : undefined}
            aria-invalid={fieldState.error ? true : undefined}
            aria-describedby={fieldState.error ? `${id}-${key}-error` : undefined}
          />
          {fieldState.error ? <FieldError id={`${id}-${key}-error`}>{fieldState.error.message}</FieldError> : null}
        </Field>
      )}
    />
  );
  if (compact) {
    return (
      <div role='group' aria-label={field.label} className='grid gap-3 sm:grid-cols-2'>
        {part('label', 'Link text')}
        {part('href', 'Link target')}
      </div>
    );
  }
  return (
    <FieldSet>
      <FieldLegend variant='label'>{field.label}</FieldLegend>
      <div className='grid gap-3 sm:grid-cols-2'>
        {part('label', 'Link text')}
        {part('href', 'Link target')}
      </div>
      {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
    </FieldSet>
  );
}
