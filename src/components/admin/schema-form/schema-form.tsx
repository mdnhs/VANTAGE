'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Resolver } from 'react-hook-form';
import type * as z from 'zod';

import { FORM_ACTION } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { SectionTabs } from '@/components/admin/section-tabs';

import { toFields, type FieldOverrides, type FormField } from './to-fields';
import { FieldWidget } from './widgets';

import { submitResultErrors, type SubmitResult } from './helpers';

export type { SubmitResult };

// Consecutive top-level fields with the same `section` become one block; a field with none is a
// block of its own without a heading, so a form that sets no sections renders as a single block.
export type FieldBlock = { section?: string; description?: string; fields: FormField[] };
export function groupBySection(fields: FormField[]): FieldBlock[] {
  const blocks: FieldBlock[] = [];
  for (const field of fields) {
    const last = blocks.at(-1);
    if (last && last.section === field.section) {
      last.fields.push(field);
      last.description ??= field.sectionDescription;
    } else {
      blocks.push({ section: field.section, description: field.sectionDescription, fields: [field] });
    }
  }
  return blocks;
}

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
  sectionTabs = false,
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
  // Draw the sections (see UiMeta.section) as horizontal tabs rather than stacked cards. Every tab
  // stays mounted, so a field on a hidden tab still validates, and a failed save opens the tab of
  // the first error and marks each tab that has one.
  sectionTabs?: boolean;
}) {
  // Callers pass inline `overrides` literals and unstable callbacks: key the
  // field tree on the overrides' content and read the callback through a ref,
  // so neither recomputes the JSON Schema or resubscribes every render.
  const overridesKey = JSON.stringify(overrides ?? {});
  const fields = useMemo(() => toFields(schema, JSON.parse(overridesKey) as FieldOverrides), [schema, overridesKey]);
  const blocks = useMemo(() => groupBySection(fields), [fields]);
  const sectioned = blocks.filter((block) => block.section);
  const tabbed = sectionTabs && sectioned.length > 1;
  const [openTab, setOpenTab] = useState<string | null>(null);
  const activeTab = openTab ?? sectioned[0]?.section ?? '';
  // Top-level field names of the given error paths ("columns.0.links.1.href" -> "columns").
  const revealError = (paths: string[]) => {
    const tops = new Set(paths.map((path) => path.split('.')[0]));
    const first = fields.find((field) => tops.has(field.name));
    if (first?.section) setOpenTab(first.section);
  };
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

  const submit = form.handleSubmit(
    async (values) => {
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
      if (errors.fields.length > 0) revealError(errors.fields.map((error) => error.name));
      if (errors.root) form.setError('root', { message: errors.root });
      // Same as MK: reset to the form's initial values (the caller re-keys or
      // passes new defaultValues when it wants to show what was saved).
      if (!result && resetOnSuccess) form.reset(defaultValues as FieldValues);
    },
    (invalid) => revealError(Object.keys(invalid)),
  );

  const rootError = form.formState.errors.root?.message;
  const pending = form.formState.isSubmitting;
  const erroredSections = new Set(
    fields.filter((field) => field.section && field.name in form.formState.errors).map((field) => field.section),
  );

  return (
    <form onSubmit={submit} noValidate className='flex flex-col gap-6'>
      {tabbed ? (
        <>
          {blocks
            .filter((block) => !block.section)
            .map((block, index) => (
              <FieldGroup key={`plain-${index}`}>
                {block.fields.map((field) => (
                  <FieldWidget key={field.name} field={field} control={form.control} />
                ))}
              </FieldGroup>
            ))}
          <SectionTabs
            value={activeTab}
            onValueChange={setOpenTab}
            tabs={sectioned.map((block) => ({
              value: block.section!,
              label: block.section!,
              description: block.description,
              invalid: erroredSections.has(block.section),
              content: (
                <FieldGroup>
                  {block.fields.map((field) => (
                    <FieldWidget key={field.name} field={field} control={form.control} />
                  ))}
                </FieldGroup>
              ),
            }))}
          />
        </>
      ) : (
        blocks.map((block, index) =>
          block.section ? (
            <section
              key={`${block.section}-${index}`}
              data-section={block.section}
              aria-labelledby={`section-${index}`}
              className='flex scroll-mt-4 flex-col gap-5 rounded-xl border p-4 sm:p-5'
            >
              <div className='flex flex-col gap-1'>
                <h3 id={`section-${index}`} className='text-base font-semibold'>
                  {block.section}
                </h3>
                {block.description ? <p className='text-sm text-muted-foreground'>{block.description}</p> : null}
              </div>
              <FieldGroup>
                {block.fields.map((field) => (
                  <FieldWidget key={field.name} field={field} control={form.control} />
                ))}
              </FieldGroup>
            </section>
          ) : (
            <FieldGroup key={`plain-${index}`}>
              {block.fields.map((field) => (
                <FieldWidget key={field.name} field={field} control={form.control} />
              ))}
            </FieldGroup>
          ),
        )
      )}
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
