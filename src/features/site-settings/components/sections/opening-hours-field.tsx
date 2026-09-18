'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  parseOpeningHours,
  serializeOpeningHours,
  formatOpeningHoursSummary,
  DEFAULT_OPENING_HOURS,
  type DaySchedule,
} from '../../lib/opening-hours';

interface OpeningHoursFieldProps {
  value?: string;
  onChange: (serialized: string) => void;
}

export function OpeningHoursField({ value, onChange }: OpeningHoursFieldProps) {
  const schedule = useMemo(() => parseOpeningHours(value), [value]);

  const updateSchedule = (newSchedule: DaySchedule[]) => {
    onChange(serializeOpeningHours(newSchedule));
  };

  const handleToggleDay = (index: number, isOpen: boolean) => {
    const next = schedule.map((item, i) => (i === index ? { ...item, isOpen } : item));
    updateSchedule(next);
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', val: string) => {
    const next = schedule.map((item, i) => (i === index ? { ...item, [field]: val } : item));
    updateSchedule(next);
  };

  const handleCopyMondayToWeekdays = () => {
    const monday = schedule[0];
    const next = schedule.map((day, idx) => {
      if (idx >= 1 && idx <= 4) {
        return {
          ...day,
          isOpen: monday.isOpen,
          openTime: monday.openTime,
          closeTime: monday.closeTime,
        };
      }
      return day;
    });
    updateSchedule(next);
  };

  const handleApplyPreset = (type: 'weekdays' | 'mon-sat' | 'reset') => {
    if (type === 'reset') {
      updateSchedule(structuredClone(DEFAULT_OPENING_HOURS));
      return;
    }
    const next = schedule.map((day, idx) => {
      if (type === 'weekdays') {
        const isWeekend = idx >= 5;
        return { ...day, isOpen: !isWeekend, openTime: '08:00', closeTime: '18:00' };
      }
      if (idx < 5) return { ...day, isOpen: true, openTime: '08:00', closeTime: '18:00' };
      if (idx === 5) return { ...day, isOpen: true, openTime: '09:00', closeTime: '14:00' };
      return { ...day, isOpen: false, openTime: '09:00', closeTime: '14:00' };
    });
    updateSchedule(next);
  };

  const summary = formatOpeningHoursSummary(schedule);

  return (
    <div className='flex max-w-lg flex-col gap-2'>
      {/* Subtle quick presets */}
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span>Set open & close hours:</span>
        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            onClick={() => handleApplyPreset('weekdays')}
            className='underline-offset-2 transition-colors hover:text-foreground hover:underline'
          >
            Mon–Fri
          </button>
          <span>·</span>
          <button
            type='button'
            onClick={() => handleApplyPreset('mon-sat')}
            className='underline-offset-2 transition-colors hover:text-foreground hover:underline'
          >
            Mon–Sat
          </button>
          <span>·</span>
          <button
            type='button'
            onClick={() => handleApplyPreset('reset')}
            className='underline-offset-2 transition-colors hover:text-foreground hover:underline'
          >
            Reset
          </button>
        </div>
      </div>

      {/* Facebook-style compact day list */}
      <div className='divide-y divide-border/60 overflow-hidden rounded-lg border border-border bg-card shadow-xs'>
        {schedule.map((item, index) => {
          const isMonday = index === 0;
          return (
            <div
              key={item.day}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm transition-colors',
                item.isOpen ? 'bg-background/60' : 'bg-muted/15',
              )}
            >
              {/* Checkbox + Day Label */}
              <label className='flex w-28 shrink-0 cursor-pointer items-center gap-2.5 select-none'>
                <input
                  type='checkbox'
                  checked={item.isOpen}
                  onChange={(e) => handleToggleDay(index, e.target.checked)}
                  className='size-4 cursor-pointer rounded border-input text-primary accent-primary focus:ring-1 focus:ring-primary/40'
                />
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    item.isOpen ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.day}
                </span>
              </label>

              {/* Time inputs or Closed */}
              <div className='flex flex-1 items-center justify-end gap-2'>
                {item.isOpen ? (
                  <div className='flex items-center gap-1.5'>
                    <Input
                      type='time'
                      value={item.openTime}
                      onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                      className='h-7 w-[98px] px-2 font-mono text-xs'
                      aria-label={`${item.day} open time`}
                    />
                    <span className='text-xs text-muted-foreground'>–</span>
                    <Input
                      type='time'
                      value={item.closeTime}
                      onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                      className='h-7 w-[98px] px-2 font-mono text-xs'
                      aria-label={`${item.day} close time`}
                    />
                    {isMonday && (
                      <button
                        type='button'
                        onClick={handleCopyMondayToWeekdays}
                        className='ml-2 hidden cursor-pointer text-[11px] whitespace-nowrap text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:inline-block'
                        title='Copy Monday hours to Tuesday through Friday'
                      >
                        Copy to weekdays
                      </button>
                    )}
                  </div>
                ) : (
                  <span className='py-1 pr-2 text-xs text-muted-foreground italic'>Closed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact preview line */}
      <div className='flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground'>
        <Clock className='size-3.5 shrink-0 text-muted-foreground/70' />
        <span className='truncate'>
          Preview: <strong className='font-medium text-foreground'>{summary}</strong>
        </span>
      </div>
    </div>
  );
}
