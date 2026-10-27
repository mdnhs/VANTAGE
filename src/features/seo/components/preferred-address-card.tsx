'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActor, useCan } from '@/contexts/actor-provider';
import { useSaveGlobal } from '@/features/globals/hooks/api/mutation/use-save-global';
import { useGlobal } from '@/features/globals/hooks/api/query/use-global';
import { appHostFrom, type PreferredHost } from '@/lib/seo/canonical-host';

const isPreferred = (value: unknown): value is PreferredHost => value === 'off' || value === 'apex' || value === 'www';

// The site answers on http/https with and without www. Pick the one that counts and the other
// three send visitors (and Google) to it with a permanent redirect.
export function PreferredAddressCard() {
  const actor = useActor();
  const canEdit = useCan({ seo: ['update'] }) && !actor.impersonatedBy;
  const doc = useGlobal('seo');
  const { save, isPending } = useSaveGlobal('seo');
  const [picked, setPicked] = useState<PreferredHost | null>(null);

  const host = appHostFrom(process.env.NEXT_PUBLIC_APP_URL) ?? 'your-domain.com';
  const items = [
    { value: 'off', label: 'Off: keep all four addresses working' },
    { value: 'apex', label: `Without www: https://${host}` },
    { value: 'www', label: `With www: https://www.${host}` },
  ] satisfies { value: PreferredHost; label: string }[];

  const stored = (doc.data?.value as { preferredHost?: unknown } | null | undefined)?.preferredHost;
  const current: PreferredHost = isPreferred(stored) ? stored : 'off';
  const value = picked ?? current;

  async function onSave() {
    if (!doc.data) return;
    const result = await save({
      version: doc.data.version,
      value: { ...(doc.data.value as object), preferredHost: value },
    });
    if (result.saved) {
      setPicked(null);
      toast.success('Preferred address saved. It applies within a minute.');
    } else if (result.conflict) {
      toast.error('Someone else changed this. The latest version is loaded; try again.');
    } else {
      toast.error(('formError' in result && result.formError) || 'Could not save');
    }
  }

  return (
    <section aria-labelledby='preferred-address-title' className='flex flex-col gap-4 rounded-lg border p-4 sm:p-5'>
      <div className='flex flex-col gap-1'>
        <h2 id='preferred-address-title' className='text-base font-semibold'>
          Preferred address
        </h2>
        <p className='text-sm text-muted-foreground'>
          http://, https://, with and without www are four addresses to Google. Choose one: the other three are sent to
          it with a permanent (301) redirect, so search results gather on a single address.
        </p>
      </div>
      <Field>
        <FieldLabel htmlFor='preferred-address'>Main address</FieldLabel>
        <Select
          items={items}
          value={value}
          disabled={!canEdit || doc.isPending}
          onValueChange={(next) => setPicked(isPreferred(next) ? next : null)}
        >
          <SelectTrigger id='preferred-address' className='w-full sm:w-96'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          Make sure the site&apos;s certificate covers both with and without www before turning this on. Also use the
          same address as your Search Console property.
        </FieldDescription>
      </Field>
      {canEdit ? (
        <div>
          <Button onClick={onSave} disabled={isPending || doc.isPending || value === current}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
