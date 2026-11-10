import { describe, expect, it } from 'vitest';

import { buildHoursRows, isOpenAt } from './hours-card';

const weekly = [
  { days: [1, 2, 3, 4, 5], opens: '08:00', closes: '18:00' },
  { days: [6], opens: '09:00', closes: '14:00' },
];

describe('buildHoursRows', () => {
  it('turns the weekly groups into one row per run of days, closed days included', () => {
    expect(buildHoursRows(weekly, 'Closed')).toEqual([
      { label: 'Monday – Friday', value: '8:00 – 18:00', closed: false },
      { label: 'Saturday', value: '9:00 – 14:00', closed: false },
      { label: 'Sunday', value: 'Closed', closed: true },
    ]);
  });

  it('lists days that are not a run, and merges days sharing the same hours', () => {
    const rows = buildHoursRows([{ days: [1, 3], opens: '10:00', closes: '16:00' }], 'Shut');
    expect(rows[0]).toEqual({ label: 'Monday', value: '10:00 – 16:00', closed: false });
    expect(rows[1]).toEqual({ label: 'Tuesday', value: 'Shut', closed: true });
    expect(buildHoursRows([{ days: [1, 2], opens: '09:00', closes: '17:00' }], 'Closed')[0]!.label).toBe(
      'Monday – Tuesday',
    );
  });

  it('marks the whole week closed when there are no groups', () => {
    expect(buildHoursRows([], 'Closed')).toEqual([{ label: 'Monday – Sunday', value: 'Closed', closed: true }]);
  });
});

describe('isOpenAt', () => {
  // 2026-11-09 is a Monday; Dublin is on GMT in November, BST in summer.
  it('is open inside a group and closed outside it', () => {
    expect(isOpenAt(weekly, new Date('2026-11-09T10:00:00Z'), 'Europe/Dublin')).toBe(true);
    expect(isOpenAt(weekly, new Date('2026-11-09T18:00:00Z'), 'Europe/Dublin')).toBe(false);
    expect(isOpenAt(weekly, new Date('2026-11-09T07:59:00Z'), 'Europe/Dublin')).toBe(false);
  });

  it('reads the wall clock of the zone (summer time) and the right weekday', () => {
    expect(isOpenAt(weekly, new Date('2026-07-06T07:30:00Z'), 'Europe/Dublin')).toBe(true); // 08:30 BST Monday
    expect(isOpenAt(weekly, new Date('2026-11-14T10:00:00Z'), 'Europe/Dublin')).toBe(true); // Saturday
    expect(isOpenAt(weekly, new Date('2026-11-15T10:00:00Z'), 'Europe/Dublin')).toBe(false); // Sunday
  });
});
