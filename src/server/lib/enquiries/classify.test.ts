import { describe, expect, it } from 'vitest';

import { classifySubmission } from './classify';
import { issueStamp } from './stamp';

const t = 1_800_000_000_000;

describe('classifySubmission', () => {
  it('passes a human', () => {
    expect(classifySubmission({ website: '', stamp: issueStamp(t) }, t + 5_000)).toBeNull();
    expect(classifySubmission({ stamp: issueStamp(t) }, t + 5_000)).toBeNull();
    expect(classifySubmission({ website: '   ', stamp: issueStamp(t) }, t + 5_000)).toBeNull();
  });

  it('flags a filled honeypot first', () => {
    expect(classifySubmission({ website: 'http://x', stamp: issueStamp(t) }, t + 5_000)).toBe('honeypot');
    expect(classifySubmission({ website: 'x' }, t)).toBe('honeypot');
  });

  it('flags the stamp', () => {
    expect(classifySubmission({}, t)).toBe('stamp');
    expect(classifySubmission({ stamp: issueStamp(t) }, t + 1_000)).toBe('too-fast');
  });
});
