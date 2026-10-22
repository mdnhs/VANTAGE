'use client';

import { useState } from 'react';

import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { ConsentBannerView, type ConsentCopy } from '@/components/consent/consent-banner-view';
import { Button } from '@/components/ui/button';
import { GlobalEditor } from '@/features/globals/components/global-editor';
import { useGlobal } from '@/features/globals/hooks/api/query/use-global';
import type { GlobalValue } from '@/lib/content/globals';
import type { ConsentChoice } from '@/lib/tracking/consent';

const NOOP = () => {};

// Left: the generic editor. Right: the banner as visitors see it, fed by the
// unsaved draft. Nothing in the preview is stored as a visitor choice.
export function ConsentView() {
  const saved = useGlobal('consent');
  const [draft, setDraft] = useState<Partial<GlobalValue<'consent'>> | null>(null);
  const [mode, setMode] = useState<'first' | 'custom'>('first');
  const [choice, setChoice] = useState<ConsentChoice>({ analytics: false, marketing: false });
  const base = saved.data?.value as GlobalValue<'consent'> | undefined;
  const copy = base ? ({ ...base, ...draft } as ConsentCopy) : undefined;

  return (
    <div className='grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
      <GlobalEditor
        title='Consent banner'
        keys={['consent']}
        onValuesChange={(values) => setDraft(values as Partial<GlobalValue<'consent'>>)}
      />
      <DashboardCard title='Preview' className='xl:sticky xl:top-6'>
        <div className='flex gap-2'>
          {(
            [
              ['first', 'First layer'],
              ['custom', 'Customise'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type='button'
              variant={mode === value ? 'default' : 'outline'}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className='relative h-105 overflow-hidden rounded-xl border bg-muted'>
          {copy ? (
            <ConsentBannerView
              inline
              copy={copy}
              mode={mode}
              choice={choice}
              onAccept={NOOP}
              onReject={NOOP}
              onCustomise={() => setMode('custom')}
              onSave={NOOP}
              onToggle={(category, on) => setChoice((c) => ({ ...c, [category]: on }))}
            />
          ) : null}
        </div>
        <p className='text-sm text-muted-foreground'>
          A preview only: nothing here is saved or stored as a visitor choice.
        </p>
      </DashboardCard>
    </div>
  );
}
