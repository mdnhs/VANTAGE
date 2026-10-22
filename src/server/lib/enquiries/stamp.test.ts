import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkStamp, issueStamp, STAMP_MAX_MS } from './stamp';

const t = 1_800_000_000_000;

describe('enquiry stamp', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('accepts a stamp older than 3 s', () => {
    expect(checkStamp(issueStamp(t), t + 5_000)).toBe('ok');
    expect(checkStamp(issueStamp(t), t + 3_000)).toBe('ok');
  });

  it('flags a fast fill', () => {
    expect(checkStamp(issueStamp(t), t + 1_000)).toBe('too-fast');
    expect(checkStamp(issueStamp(t), t + 2_999)).toBe('too-fast');
  });

  it('flags missing, tampered, garbage, future and expired stamps', () => {
    expect(checkStamp(undefined, t)).toBe('stamp');
    expect(checkStamp('', t)).toBe('stamp');
    expect(checkStamp('garbage', t)).toBe('stamp');
    expect(checkStamp(`${t}.deadbeef`, t + 5_000)).toBe('stamp');
    const [ms, mac] = issueStamp(t).split('.');
    expect(checkStamp(`${ms}.${mac!.slice(0, -1)}${mac!.endsWith('0') ? '1' : '0'}`, t + 5_000)).toBe('stamp');
    expect(checkStamp(issueStamp(t + 60_000), t)).toBe('stamp');
    expect(checkStamp(issueStamp(t), t + 8 * 86_400_000)).toBe('stamp');
    expect(checkStamp(issueStamp(t), t + STAMP_MAX_MS + 1)).toBe('stamp');
  });

  it('fails open without a usable secret', () => {
    vi.stubEnv('AUTH_SECRET', '');
    expect(issueStamp(t)).toBe('');
    expect(checkStamp(undefined, t)).toBe('ok');
    expect(checkStamp('junk', t)).toBe('ok');
  });
});
