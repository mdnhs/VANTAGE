'use client';

import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { GroupShell, type WidgetProps } from './shell';

export type WeeklyDay = { day: string; open: string; close: string; closed: boolean };

// Opening hours for a `weekly[]` array of `{ day, open, close, closed }`, one
// row per entry: a switch (open/closed) and two time inputs. Selected with an
// override (`{ weekly: { widget: 'weekly-hours' } }`).
export function WeeklyHoursWidget({ field, value, onChange, onBlur, error }: WidgetProps<WeeklyDay[] | undefined>) {
  const id = useId();
  const days = Array.isArray(value) ? value : [];
  const update = (index: number, patch: Partial<WeeklyDay>) =>
    onChange(days.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <GroupShell id={id} field={field} error={error}>
      <div className='divide-y divide-border/60 overflow-hidden rounded-lg border border-border bg-card'>
        {days.map((item, index) => (
          <div
            key={item.day}
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm',
              item.closed ? 'bg-muted/15' : 'bg-background/60',
            )}
          >
            <label className='flex w-32 shrink-0 items-center gap-2.5'>
              <Switch
                checked={!item.closed}
                onCheckedChange={(open) => update(index, { closed: !open })}
                aria-label={`${item.day} open`}
              />
              <span className={cn('font-medium', item.closed && 'text-muted-foreground')}>{item.day}</span>
            </label>
            {item.closed ? (
              <span className='pr-2 text-xs text-muted-foreground italic'>Closed</span>
            ) : (
              <div className='flex items-center gap-1.5'>
                <Input
                  type='time'
                  value={item.open}
                  onBlur={onBlur}
                  aria-invalid={error ? true : undefined}
                  onChange={(event) => update(index, { open: event.target.value })}
                  className='h-7 w-[98px] px-2 font-mono text-xs'
                  aria-label={`${item.day} open time`}
                />
                <span className='text-xs text-muted-foreground'>–</span>
                <Input
                  type='time'
                  value={item.close}
                  onBlur={onBlur}
                  aria-invalid={error ? true : undefined}
                  onChange={(event) => update(index, { close: event.target.value })}
                  className='h-7 w-[98px] px-2 font-mono text-xs'
                  aria-label={`${item.day} close time`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </GroupShell>
  );
}
