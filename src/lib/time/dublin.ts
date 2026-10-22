const dublin = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Dublin',
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Milliseconds Europe/Dublin is ahead of UTC at the given instant (0 in winter, 1 h in summer).
function dublinOffsetMs(instant: number): number {
  const part = Object.fromEntries(dublin.formatToParts(instant).map((p) => [p.type, Number(p.value)]));
  const wall = Date.UTC(part.year!, part.month! - 1, part.day, part.hour, part.minute, part.second);
  return wall - Math.floor(instant / 1000) * 1000;
}

// The UTC instant of 00:00 Irish time on `day` (YYYY-MM-DD) plus `offsetDays` calendar days.
// Irish clock changes happen at 01:00 UTC, so local midnight always exists and is unambiguous.
export function dublinMidnight(day: string, offsetDays = 0): Date {
  const [year, month, date] = day.split('-').map(Number);
  const wall = Date.UTC(year!, month! - 1, date! + offsetDays);
  const first = wall - dublinOffsetMs(wall);
  return new Date(wall - dublinOffsetMs(first));
}
