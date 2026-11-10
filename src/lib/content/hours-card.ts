// The opening-hours card on the Contact page: rows built from the weekly groups an editor sets
// under Settings > Contact (ISO weekdays, 1 = Monday … 7 = Sunday), and the open / closed state.

export interface WeeklyGroup {
  days: number[];
  opens: string;
  closes: string;
}

export interface HoursRow {
  label: string;
  value: string;
  closed: boolean;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// 08:00 -> 8:00
const clock = (time: string) => time.replace(/^0/, '');

function dayLabel(days: number[]): string {
  const names = days.map((d) => DAY_NAMES[d - 1]!);
  // A run of consecutive days reads as a range, anything else as a list.
  const consecutive = days.length > 2 && days.every((d, i) => i === 0 || d === days[i - 1]! + 1);
  if (days.length === 2 && days[1] === days[0]! + 1) return `${names[0]} – ${names[1]}`;
  if (consecutive) return `${names[0]} – ${names[names.length - 1]}`;
  return names.join(', ');
}

// One row per run of days that share the same hours (or the same "closed"), in week order.
export function buildHoursRows(weekly: WeeklyGroup[], closedLabel: string): HoursRow[] {
  const value = (day: number) => {
    const group = weekly.find((g) => g.days.includes(day));
    return group ? `${clock(group.opens)} – ${clock(group.closes)}` : null;
  };
  const rows: { days: number[]; value: string | null }[] = [];
  for (let day = 1; day <= 7; day++) {
    const v = value(day);
    const last = rows[rows.length - 1];
    if (last && last.value === v) last.days.push(day);
    else rows.push({ days: [day], value: v });
  }
  return rows.map((r) => ({
    label: dayLabel(r.days),
    value: r.value ?? closedLabel,
    closed: r.value === null,
  }));
}

const toMinutes = (time: string) => {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
};

// Whether the workshop is open at `now`, read on the wall clock of `timeZone`.
export function isOpenAt(weekly: WeeklyGroup[], now: Date, timeZone: string): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')) + 1;
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  return weekly.some((g) => g.days.includes(day) && minutes >= toMinutes(g.opens) && minutes < toMinutes(g.closes));
}
