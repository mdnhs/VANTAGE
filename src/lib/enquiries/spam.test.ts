import { describe, expect, it } from 'vitest';

import { SPAM_REASONS, SPAM_STATUS, spamReasonLabel } from './spam';

describe('spam model', () => {
  it('has the status and reasons', () => {
    expect(SPAM_STATUS).toBe('spam');
    expect(SPAM_REASONS).toEqual(['honeypot', 'stamp', 'too-fast', 'manual']);
  });

  it('labels every reason, and unknown ones', () => {
    expect(spamReasonLabel('honeypot')).toBe('Hidden field filled in');
    expect(spamReasonLabel('stamp')).toBe('Form stamp missing or expired');
    expect(spamReasonLabel('too-fast')).toBe('Submitted too quickly');
    expect(spamReasonLabel('manual')).toBe('Marked as spam by staff');
    expect(spamReasonLabel(null)).toBe('Unknown');
    expect(spamReasonLabel('toString')).toBe('Unknown');
  });
});
