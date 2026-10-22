import { describe, expect, it } from 'vitest';

import { newEventId } from './event-id';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newEventId', () => {
  it('uses randomUUID when available', () => {
    expect(newEventId({ randomUUID: () => 'abc' })).toBe('abc');
  });
  it('falls back to a v4 id from getRandomValues', () => {
    const c = {
      getRandomValues: (a: Uint8Array) => {
        a.fill(255);
        return a;
      },
    };
    expect(newEventId(c)).toMatch(V4);
  });
  it('is undefined without Web Crypto, or when it throws', () => {
    expect(newEventId(null)).toBeUndefined();
    expect(newEventId({})).toBeUndefined();
    expect(
      newEventId({
        randomUUID: () => {
          throw new Error('x');
        },
      }),
    ).toBeUndefined();
  });
});
