import { expect, it } from 'vitest';

import { formatDelta, formatNumber, formatPercent, formatShare, relativeTime } from './format';

it('formatNumber groups thousands', () => expect(formatNumber(12345)).toBe('12,345'));
it('formatPercent rounds a ratio', () => expect(formatPercent(0.256)).toBe('26%'));
it('formatShare floors and dashes on empty total', () => {
  expect(formatShare(199, 200)).toBe('99%');
  expect(formatShare(0, 0)).toBe('—');
});
it('formatDelta', () => {
  expect(formatDelta(110, 100)).toEqual({ label: '+10%', direction: 'up' });
  expect(formatDelta(90, 100)).toEqual({ label: '-10%', direction: 'down' });
  expect(formatDelta(100, 100)).toEqual({ label: 'No change', direction: 'flat' });
  expect(formatDelta(5, 0)).toBeNull();
  expect(formatDelta(0, 0)).toEqual({ label: 'No change', direction: 'flat' });
});
it('relativeTime', () => {
  const now = Date.parse('2026-10-22T12:00:00Z');
  expect(relativeTime('2026-10-22T11:59:30Z', now)).toBe('just now');
  expect(relativeTime('2026-10-22T10:00:00Z', now)).toBe('2 hours ago');
  expect(relativeTime('2026-10-21T12:00:00Z', now)).toBe('yesterday');
});
