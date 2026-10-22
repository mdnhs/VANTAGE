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

  it('fails open when no stamp came with the form', () => {
    expect(classifySubmission({}, t)).toBeNull();
    expect(classifySubmission({ stamp: '' }, t)).toBeNull();
  });

  it('flags the stamp', () => {
    expect(classifySubmission({ stamp: 'garbage' }, t)).toBe('stamp');
    expect(classifySubmission({ stamp: `${t}.deadbeef` }, t + 5_000)).toBe('stamp');
    expect(classifySubmission({ stamp: issueStamp(t) }, t + 1_000)).toBe('too-fast');
  });
});
