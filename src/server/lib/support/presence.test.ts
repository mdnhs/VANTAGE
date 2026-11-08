import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPresence } from './presence';

const GRACE = 30_000;

describe('agent presence', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  const presence = () => createPresence(new Map(), GRACE);

  it('counts an agent as online while a stream is held', () => {
    const p = presence();
    expect(p.anyOnline()).toBe(false);
    p.hold('a');
    expect(p.isOnline('a')).toBe(true);
    expect(p.anyOnline()).toBe(true);
    expect(p.isOnline('b')).toBe(false);
  });

  it('keeps the agent online through the grace period after the stream ends', () => {
    const p = presence();
    p.hold('a')();
    vi.advanceTimersByTime(GRACE - 1);
    expect(p.isOnline('a')).toBe(true);
  });

  it('marks the agent offline once the grace period has passed', () => {
    const p = presence();
    p.hold('a')();
    vi.advanceTimersByTime(GRACE);
    expect(p.isOnline('a')).toBe(false);
    expect(p.anyOnline()).toBe(false);
  });

  it('stays online when a stream is replaced within the grace period', () => {
    const p = presence();
    const first = p.hold('a');
    first();
    vi.advanceTimersByTime(GRACE / 2);
    const second = p.hold('a');
    vi.advanceTimersByTime(GRACE);
    expect(p.isOnline('a')).toBe(true);
    second();
    vi.advanceTimersByTime(GRACE);
    expect(p.isOnline('a')).toBe(false);
  });

  it('needs every tab to go before the agent is offline', () => {
    const p = presence();
    const one = p.hold('a');
    p.hold('a');
    one();
    vi.advanceTimersByTime(GRACE);
    expect(p.isOnline('a')).toBe(true);
  });
});
