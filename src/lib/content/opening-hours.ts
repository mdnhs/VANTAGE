export type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type ShortDayName = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface DaySchedule {
  day: DayName;
  shortDay: ShortDayName;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export const DAYS_OF_WEEK: readonly { day: DayName; shortDay: ShortDayName }[] = [
  { day: 'Monday', shortDay: 'Mon' },
  { day: 'Tuesday', shortDay: 'Tue' },
  { day: 'Wednesday', shortDay: 'Wed' },
  { day: 'Thursday', shortDay: 'Thu' },
  { day: 'Friday', shortDay: 'Fri' },
  { day: 'Saturday', shortDay: 'Sat' },
  { day: 'Sunday', shortDay: 'Sun' },
] as const;

export const DEFAULT_OPENING_HOURS: DaySchedule[] = [
  { day: 'Monday', shortDay: 'Mon', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Tuesday', shortDay: 'Tue', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Wednesday', shortDay: 'Wed', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Thursday', shortDay: 'Thu', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Friday', shortDay: 'Fri', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Saturday', shortDay: 'Sat', isOpen: false, openTime: '09:00', closeTime: '14:00' },
  { day: 'Sunday', shortDay: 'Sun', isOpen: false, openTime: '09:00', closeTime: '14:00' },
];

function padTime(timeStr: string): string {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return '08:00';
  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1].padEnd(2, '0');
  return `${hours}:${minutes}`;
}

export function parseOpeningHours(raw?: string | null): DaySchedule[] {
  if (!raw || !raw.trim()) {
    return structuredClone(DEFAULT_OPENING_HOURS);
  }

  const trimmed = raw.trim();

  // Try parsing JSON format
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return DAYS_OF_WEEK.map(({ day, shortDay }) => {
          const match = parsed.find(
            (p: unknown) => typeof p === 'object' && p !== null && 'day' in p && (p as { day: string }).day === day,
          );

          if (match && typeof match === 'object') {
            const m = match as Partial<DaySchedule>;
            return {
              day,
              shortDay,
              isOpen: Boolean(m.isOpen),
              openTime: m.openTime ? padTime(String(m.openTime)) : '08:00',
              closeTime: m.closeTime ? padTime(String(m.closeTime)) : '18:00',
            };
          }

          // Fallback if day missing from array
          const defaultDay = DEFAULT_OPENING_HOURS.find((d) => d.day === day)!;
          return { ...defaultDay };
        });
      }
    } catch {
      // JSON parse failed, fall back to legacy string parsing below
    }
  }

  // Attempt to parse legacy format such as "Mon–Fri: 8:00 – 18:00"
  const timeMatch = trimmed.match(/(\d{1,2}:\d{2})\s*(?:-|–|to)\s*(\d{1,2}:\d{2})/i);
  if (timeMatch) {
    const openTime = padTime(timeMatch[1]);
    const closeTime = padTime(timeMatch[2]);
    return DAYS_OF_WEEK.map(({ day, shortDay }) => {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      return {
        day,
        shortDay,
        isOpen: !isWeekend,
        openTime,
        closeTime,
      };
    });
  }

  return structuredClone(DEFAULT_OPENING_HOURS);
}

export function serializeOpeningHours(schedule: DaySchedule[]): string {
  return JSON.stringify(schedule);
}

export function formatOpeningHoursSummary(rawOrSchedule: string | DaySchedule[] | null | undefined): string {
  if (!rawOrSchedule) {
    return 'Closed';
  }

  if (typeof rawOrSchedule === 'string') {
    const trimmed = rawOrSchedule.trim();
    if (!trimmed) return 'Closed';
    if (!trimmed.startsWith('[')) {
      // Already a plain human-readable string (e.g. legacy text)
      return trimmed;
    }
    const schedule = parseOpeningHours(trimmed);
    return formatScheduleSummary(schedule);
  }

  return formatScheduleSummary(rawOrSchedule);
}

function formatScheduleSummary(schedule: DaySchedule[]): string {
  if (!schedule || schedule.length === 0) {
    return 'Closed';
  }

  const groups: {
    days: DaySchedule[];
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }[] = [];

  for (const day of schedule) {
    const last = groups[groups.length - 1];
    const same =
      last &&
      last.isOpen === day.isOpen &&
      (!day.isOpen || (last.openTime === day.openTime && last.closeTime === day.closeTime));

    if (same) {
      last.days.push(day);
    } else {
      groups.push({
        days: [day],
        isOpen: day.isOpen,
        openTime: day.openTime || '08:00',
        closeTime: day.closeTime || '18:00',
      });
    }
  }

  return groups
    .map((g) => {
      const label =
        g.days.length === 1 ? g.days[0].shortDay : `${g.days[0].shortDay}–${g.days[g.days.length - 1].shortDay}`;
      if (!g.isOpen) {
        return `${label}: Closed`;
      }
      return `${label}: ${g.openTime} – ${g.closeTime}`;
    })
    .join(', ');
}
