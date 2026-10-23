'use client';

import { PlusIcon, TrashIcon } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

import { GroupShell, type WidgetProps } from './shell';

export type HoursGroup = { days: number[]; opens: string; closes: string };

// ISO weekdays, Monday first.
export const WEEKDAYS = [
  { value: 1, short: 'Mon', name: 'Monday' },
  { value: 2, short: 'Tue', name: 'Tuesday' },
  { value: 3, short: 'Wed', name: 'Wednesday' },
  { value: 4, short: 'Thu', name: 'Thursday' },
  { value: 5, short: 'Fri', name: 'Friday' },
  { value: 6, short: 'Sat', name: 'Saturday' },
  { value: 7, short: 'Sun', name: 'Sunday' },
] as const;

export const NEW_HOURS_GROUP: HoursGroup = { days: [1, 2, 3, 4, 5], opens: '08:00', closes: '18:00' };

// Toggles one ISO weekday, keeping the list sorted and unique.
export function toggleDay(days: readonly number[], day: number, on: boolean): number[] {
  const rest = days.filter((d) => d !== day);
  return (on ? [...rest, day] : rest).sort((a, b) => a - b);
}

// Opening hours as groups of days sharing one open/close time:
// `{ days: number[], opens, closes }[]`. Selected with an override
// (`{ 'hours.weekly': { widget: 'weekly-hours-groups' } }`).
export function WeeklyHoursGroupsWidget({
  field,
  value,
  onChange,
  onBlur,
  error,
}: WidgetProps<HoursGroup[] | undefined>) {
  const id = useId();
  const rows = Array.isArray(value) ? value : [];
  const max = field.maxItems ?? field.node.maxItems ?? 7;
  const update = (index: number, patch: Partial<HoursGroup>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <GroupShell id={id} field={field} error={error}>
      <ol className='flex flex-col gap-3'>
        {rows.map((row, index) => (
          <li key={index} className='flex flex-col gap-3 rounded-xl border p-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-sm font-medium'>Opening times {index + 1}</span>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={`Remove opening times ${index + 1}`}
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
              >
                <TrashIcon aria-hidden />
              </Button>
            </div>
            <div role='group' aria-label={`Days for opening times ${index + 1}`} className='flex flex-wrap gap-3'>
              {WEEKDAYS.map((day) => (
                <label key={day.value} className='flex items-center gap-1.5 text-sm'>
                  <Checkbox
                    checked={row.days?.includes(day.value) ?? false}
                    onCheckedChange={(on) => update(index, { days: toggleDay(row.days ?? [], day.value, on === true) })}
                  />
                  <span className='sr-only'>{day.name}</span>
                  <span aria-hidden>{day.short}</span>
                </label>
              ))}
            </div>
            <div className='flex items-center gap-1.5'>
              <Input
                type='time'
                value={row.opens ?? ''}
                onBlur={onBlur}
                aria-invalid={error ? true : undefined}
                aria-label={`Opens, opening times ${index + 1}`}
                onChange={(event) => update(index, { opens: event.target.value })}
                className='h-9 w-28 font-mono'
              />
              <span className='text-muted-foreground'>–</span>
              <Input
                type='time'
                value={row.closes ?? ''}
                onBlur={onBlur}
                aria-invalid={error ? true : undefined}
                aria-label={`Closes, opening times ${index + 1}`}
                onChange={(event) => update(index, { closes: event.target.value })}
                className='h-9 w-28 font-mono'
              />
            </div>
          </li>
        ))}
      </ol>
      <div>
        <Button
          type='button'
          variant='outline'
          disabled={rows.length >= max}
          onClick={() => onChange([...rows, { ...NEW_HOURS_GROUP, days: [...NEW_HOURS_GROUP.days] }])}
        >
          <PlusIcon data-icon='inline-start' />
          Add opening times
        </Button>
      </div>
    </GroupShell>
  );
}
