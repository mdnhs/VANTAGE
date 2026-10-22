'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REDIRECT_STATUSES, RedirectInput, type RedirectDto, type RedirectStatus } from '@/lib/seo/redirect-rules';

import { useCreateRedirect, useUpdateRedirect } from '../hooks/use-redirects';
import { RedirectsApiError } from '../services/redirects-api';

export const STATUS_LABELS: Record<RedirectStatus, string> = {
  301: '301 Permanent',
  302: '302 Temporary',
  307: '307 Temporary',
  308: '308 Permanent',
};

const STATUS_ITEMS = REDIRECT_STATUSES.map((code) => ({ value: String(code), label: STATUS_LABELS[code] }));

export type Editing = RedirectDto | 'new' | null;

export function RedirectDialog({ editing, onClose }: { editing: Editing; onClose(): void }) {
  return (
    <Dialog open={editing !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className='sm:max-w-md'>
        {editing ? <RedirectForm key={editing === 'new' ? 'new' : editing.id} editing={editing} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RedirectForm({ editing, onClose }: { editing: RedirectDto | 'new'; onClose(): void }) {
  const isNew = editing === 'new';
  const [sourcePath, setSourcePath] = useState('');
  const [destination, setDestination] = useState(isNew ? '' : editing.destination);
  const [statusCode, setStatusCode] = useState(String(isNew ? 301 : editing.statusCode));
  const [note, setNote] = useState(isNew ? '' : editing.note);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateRedirect();
  const update = useUpdateRedirect();
  const pending = create.isPending || update.isPending;

  function fail(error: Error) {
    const causes = error instanceof RedirectsApiError ? error.causes : {};
    const known = ['sourcePath', 'destination', 'statusCode', 'note'];
    const fields = Object.fromEntries(
      Object.entries(causes)
        .filter(([k, v]) => known.includes(k) && v[0])
        .map(([k, v]) => [k, v[0]!]),
    );
    // A message with a field under it stays there; anything else is a form error.
    setErrors(Object.keys(fields).length > 0 ? fields : { form: error.message });
  }

  function done() {
    toast.success('Saved');
    onClose();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const code = Number(statusCode) as RedirectStatus;
    if (isNew) {
      const parsed = RedirectInput.safeParse({ sourcePath, destination, statusCode: code, note });
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
        setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])));
        return;
      }
      setErrors({});
      create.mutate(parsed.data, { onSuccess: done, onError: fail });
      return;
    }
    const parsed = RedirectInput.shape.destination.safeParse(destination);
    if (!parsed.success) {
      setErrors({ destination: parsed.error.issues[0]?.message ?? 'Use a path on this site, e.g. /new-page' });
      return;
    }
    setErrors({});
    update.mutate(
      { id: editing.id, patch: { destination: parsed.data, statusCode: code, note: note.trim() } },
      { onSuccess: done, onError: fail },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isNew ? 'New redirect' : 'Edit redirect'}</DialogTitle>
        <DialogDescription>
          Visitors and search engines who ask for the From address are sent to the To address. Old-site addresses like
          /about.html can be redirected too. From addresses are case-sensitive.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} noValidate className='flex flex-col gap-4'>
        <Field data-invalid={errors.sourcePath ? true : undefined}>
          <FieldLabel htmlFor='redirect-from'>From</FieldLabel>
          <Input
            id='redirect-from'
            placeholder='/old-page'
            autoComplete='off'
            value={isNew ? sourcePath : editing.sourcePath}
            disabled={!isNew}
            readOnly={!isNew}
            aria-invalid={errors.sourcePath ? true : undefined}
            onChange={(event) => setSourcePath(event.target.value)}
          />
          {errors.sourcePath ? <FieldError>{errors.sourcePath}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.destination ? true : undefined}>
          <FieldLabel htmlFor='redirect-to'>To</FieldLabel>
          <Input
            id='redirect-to'
            placeholder='/new-page'
            autoComplete='off'
            value={destination}
            aria-invalid={errors.destination ? true : undefined}
            onChange={(event) => setDestination(event.target.value)}
          />
          {errors.destination ? <FieldError>{errors.destination}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.statusCode ? true : undefined}>
          <FieldLabel htmlFor='redirect-type'>Type</FieldLabel>
          <Select items={STATUS_ITEMS} value={statusCode} onValueChange={(value) => setStatusCode(String(value))}>
            <SelectTrigger id='redirect-type' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Browsers and CDNs may keep a permanent (301/308) redirect for up to an hour; temporary ones update straight away.</FieldDescription>
          {errors.statusCode ? <FieldError>{errors.statusCode}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.note ? true : undefined}>
          <FieldLabel htmlFor='redirect-note'>Note</FieldLabel>
          <Input
            id='redirect-note'
            autoComplete='off'
            value={note}
            aria-invalid={errors.note ? true : undefined}
            onChange={(event) => setNote(event.target.value)}
          />
          {errors.note ? <FieldError>{errors.note}</FieldError> : null}
        </Field>
        {errors.form ? (
          <p role='alert' className='text-sm text-destructive'>
            {errors.form}
          </p>
        ) : null}
        <DialogFooter>
          <Button type='button' variant='outline' disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit' disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
