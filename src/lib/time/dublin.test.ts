import { describe, expect, it } from 'vitest';

import { dublinMidnight } from './dublin';

describe('dublinMidnight', () => {
  it.each([
    ['2026-01-15', 0, '2026-01-15T00:00:00.000Z'],
    ['2026-07-01', 0, '2026-06-30T23:00:00.000Z'],
    ['2026-03-29', 0, '2026-03-29T00:00:00.000Z'],
    ['2026-03-29', 1, '2026-03-29T23:00:00.000Z'],
    ['2026-10-25', 0, '2026-10-24T23:00:00.000Z'],
    ['2026-10-25', 1, '2026-10-26T00:00:00.000Z'],
    ['2026-12-31', 1, '2027-01-01T00:00:00.000Z'],
  ])('%s +%i days is %s', (day, offset, expected) => {
    expect(dublinMidnight(day, offset).toISOString()).toBe(expected);
  });
});
