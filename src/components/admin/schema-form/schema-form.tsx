'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Resolver } from 'react-hook-form';
import type * as z from 'zod';

import { FORM_ACTION } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';

import { toFields, type FieldOverrides } from './to-fields';
import { FieldWidget } from './widgets';

import { submitResultErrors, type SubmitResult } from './helpers';

export type { SubmitResult };

// docs/brief.md §9.4: the form is generated from the schema's JSON Schema
// (with x-ui hints) and validated by the same Zod schema via zodResolver.
// Server errors (e.g. an ApiError's fieldErrors) map back onto fields.
export function SchemaForm<S extends z.ZodObject>({
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  resetOnSuccess = false,
  overrides,
  onValuesChange,
  readOnly = false,
}: {
  schema: S;
  defaultValues: z.input<S>;
  onSubmit: (values: z.output<S>) => Promise<SubmitResult> | SubmitResult;
  submitLabel: string;
  resetOnSuccess?: boolean;
  overrides?: FieldOverrides;
  // Called on every change, for live previews next to the form.
  onValuesChange?: (values: z.input<S>) => void;
  // Hides the submit button (the caller disables the fields, e.g. in a fieldset).
  readOnly?: boolean;
}) {
  // Callers pass inline `overrides` literals and unstable callbacks: key the
  // field tree on the overrides' content and read the callback through a ref,
  // so neither recomputes the JSON Schema or resubscribes every render.
  const overridesKey = JSON.stringify(overrides ?? {});
  const fields = useMemo(() => toFields(schema, JSON.parse(overridesKey) as FieldOverrides), [schema, overridesKey]);
  const onValuesChangeRef = useRef(onValuesChange);
  useEffect(() => {
    onValuesChangeRef.current = onValuesChange;
  });
  const watching = Boolean(onValuesChange);
  const form = useForm<FieldValues, unknown, FieldValues>({
    resolver: zodResolver(schema as unknown as z.ZodType<FieldValues, FieldValues>) as Resolver<
      FieldValues,
      unknown,
      FieldValues
    >,
    defaultValues: defaultValues as DefaultValues<FieldValues>,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!watching) return;
    // eslint-disable-next-line react-hooks/incompatible-library
    const sub = form.watch((values) => onValuesChangeRef.current?.(values as z.input<S>));
    return () => sub.unsubscribe();
  }, [form, watching]);

  const submit = form.handleSubmit(async (values) => {
    let result: SubmitResult;
    try {
      result = await onSubmit(values as z.output<S>);
    } catch (error) {
      // A bug or an unexpected failure must not look like a silent no-op.
      console.error('SchemaForm onSubmit failed', error);
      result = { formError: 'Something went wrong. Try again.' };
    }
    const errors = submitResultErrors(result);
    for (const { name, message } of errors.fields) form.setError(name, { message });
    if (errors.root) form.setError('root', { message: errors.root });
    // Same as MK: reset to the form's initial values (the caller re-keys or
    // passes new defaultValues when it wants to show what was saved).
    if (!result && resetOnSuccess) form.reset(defaultValues as FieldValues);
  });

  const rootError = form.formState.errors.root?.message;
  const pending = form.formState.isSubmitting;

  return (
    <form onSubmit={submit} noValidate className='flex flex-col gap-6'>
      <FieldGroup>
        {fields.map((field) => (
          <FieldWidget key={field.name} field={field} control={form.control} />
        ))}
      </FieldGroup>
      {rootError ? (
        <p role='alert' className='text-sm text-destructive'>
          {rootError}
        </p>
      ) : null}
      {readOnly ? null : (
        <div>
          <Button type='submit' disabled={pending} className={FORM_ACTION}>
            {pending ? <Spinner data-icon='inline-start' /> : null}
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
