'use client';

import { Field, FieldDescription, FieldError, FieldLabel, FieldTitle } from '@/components/ui/field';

import type { FormField } from '../to-fields';

export type WidgetProps<T> = {
  field: FormField;
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  error?: string;
};

// aria-describedby for a control: the description and error ids WidgetShell
// renders.
export function describedBy(id: string, field: FormField, error?: string) {
  return [field.description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
}

// Label, description and error around one control (ids wire aria).
export function WidgetShell({
  id,
  field,
  error,
  children,
}: {
  id: string;
  field: FormField;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
      {children}
      {field.description ? <FieldDescription id={`${id}-description`}>{field.description}</FieldDescription> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

// For widgets made of several controls (image upload, weekly hours): no single
// control to point a <label> at, so the wrapper is a named group. Field already
// renders role="group"; it is named by the title and described by the
// description and error.
export function GroupShell({
  id,
  field,
  error,
  children,
}: {
  id: string;
  field: FormField;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Field
      data-invalid={error ? true : undefined}
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy(id, field, error)}
    >
      <FieldTitle id={`${id}-label`}>{field.label}</FieldTitle>
      {children}
      {field.description ? <FieldDescription id={`${id}-description`}>{field.description}</FieldDescription> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  );
}
