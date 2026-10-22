import { expect, it } from 'vitest';

import { toneForStatus } from './status-pill';

it.each([
  ['new', 'info'],
  ['contacted', 'warning'],
  ['waiting_response', 'warning'],
  ['quote_sent', 'warning'],
  ['approved', 'info'],
  ['in_progress', 'info'],
  ['completed', 'success'],
  ['replied', 'success'],
  ['cancelled', 'neutral'],
  ['archived', 'neutral'],
  ['Quote Sent', 'warning'],
  ['unknown', 'neutral'],
])('toneForStatus(%j) is %s', (status, tone) => {
  expect(toneForStatus(status)).toBe(tone);
});
