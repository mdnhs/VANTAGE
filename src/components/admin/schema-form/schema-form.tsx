'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Resolver } from 'react-hook-form';
import type * as z from 'zod';

import { FORM_ACTION } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SectionTabs } from '@/components/admin/section-tabs';

import { toFields, type FieldOverrides, type FormField } from './to-fields';
import { SectionCard } from './section-card';
import { FieldGrid, FieldWidget } from './widgets';

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
  leafTitle,
  toolbar,
  disabled = false,
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
  // Title of the card drawn around top-level fields that sit outside any group or section.
  // Left out, those fields render without a card.
  leafTitle?: string;
  // A small control (e.g. History) placed in the tab row, or in the first card's header, instead
  // of on a row of its own. It stays clickable when the fields are disabled.
  toolbar?: ReactNode;
  // Read-only: every field is disabled (the toolbar is not).
  disabled?: boolean;
}) {
  // Callers pass inline `overrides` literals and unstable callbacks: key the
  // field tree on the overrides' content and read the callback through a ref,
  // so neither recomputes the JSON Schema or resubscribes every render.
  const overridesKey = JSON.stringify(overrides ?? {});
  const formId = useId();
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

  // Fields sit in their own disabled fieldsets, so a read-only form keeps its toolbar usable.
  const guard = (node: ReactElement, key?: string) => (
    <fieldset key={key} disabled={disabled} className='min-w-0'>
      {node}
    </fieldset>
  );
  // The toolbar goes into the header of the first card drawn (forms without tabs).
  let toolbarLeft = !tabbed && toolbar !== undefined;
  const takeToolbar = () => {
    if (!toolbarLeft) return undefined;
    toolbarLeft = false;
    return toolbar;
  };

  // A run of top-level fields: leaf fields share a grid, and each group or list (a page's
  // "Top banner", "Team", "FAQ") becomes its own titled card. `data-section` lets an editor's
  // outline scroll to it by name.
  const renderFields = (list: FormField[], key: string, nested = false): ReactElement[] => {
    const out: ReactElement[] = [];
    let leaves: FormField[] = [];
    const flush = () => {
      if (leaves.length > 0) {
        const grid = guard(
          <FieldGrid key={`${key}-${out.length}`} fields={leaves} control={form.control} />,
          `${key}-${out.length}-guard`,
        );
        // Loose top-level fields get a card of their own too, so a page whose banner fields sit at
        // the top level (no group) looks like every other section.
        out.push(
          leafTitle && !nested ? (
            <SectionCard
              key={`${key}-${out.length}`}
              title={leafTitle}
              titleId={`${formId}-${key}-${out.length}`}
              action={takeToolbar()}
            >
              {grid}
            </SectionCard>
          ) : (
            grid
          ),
        );
      }
      leaves = [];
    };
    for (const field of list) {
      if ((field.widget === 'group' || field.widget === 'list') && !field.nullable) {
        flush();
        out.push(
          <SectionCard
            key={field.name}
            data-section={field.name}
            nested={nested}
            title={field.label}
            description={field.description}
            titleId={`${formId}-${field.name}`}
            action={nested ? undefined : takeToolbar()}
          >
            {guard(<FieldWidget field={field} control={form.control} bare />)}
          </SectionCard>,
        );
      } else {
        leaves.push(field);
      }
    }
    flush();
    return out;
  };

  const sectionCard = (block: FieldBlock, index: number) => (
    <SectionCard
      key={`${block.section}-${index}`}
      data-section={block.section}
      title={block.section!}
      description={block.description}
      titleId={`${formId}-section-${index}`}
      action={takeToolbar()}
    >
      <div className='flex flex-col gap-5'>{renderFields(block.fields, `section-${index}`, true)}</div>
    </SectionCard>
  );

  return (
    <form onSubmit={submit} noValidate className='flex flex-col gap-6'>
      {tabbed ? (
        <>
          {blocks
            .filter((block) => !block.section)
            .flatMap((block, index) => renderFields(block.fields, `plain-${index}`))}
          <SectionTabs
            action={toolbar}
            value={activeTab}
            onValueChange={setOpenTab}
            tabs={sectioned.map((block, index) => ({
              value: block.section!,
              label: block.section!,
              invalid: erroredSections.has(block.section),
              content: sectionCard(block, index),
            }))}
          />
        </>
      ) : (
        (() => {
          const drawn = blocks.flatMap((block, index) =>
            block.section ? [sectionCard(block, index)] : renderFields(block.fields, `plain-${index}`),
          );
          // No card to carry the toolbar: give it a row after all.
          return toolbarLeft
            ? [
                <div key='toolbar' className='flex justify-end'>
                  {toolbar}
                </div>,
                ...drawn,
              ]
            : drawn;
        })()
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
