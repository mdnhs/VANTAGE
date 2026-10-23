import { describe, expect, it } from 'vitest';

import { hitToken, isHitToken } from './hit-token';

describe('hit token', () => {
  it('is stable, 32 hex chars, and verifies', () => {
    const token = hitToken('s'.repeat(32), '/old');
    expect(token).toBe(hitToken('s'.repeat(32), '/old'));
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(isHitToken('s'.repeat(32), '/old', token)).toBe(true);
  });

  it('rejects another path or secret', () => {
    const token = hitToken('a', '/old');
    expect(isHitToken('a', '/other', token)).toBe(false);
    expect(isHitToken('b', '/old', token)).toBe(false);
  });

  it('rejects missing, empty and wrong-length tokens', () => {
    const token = hitToken('a', '/old');
    for (const bad of [null, undefined, '', token.slice(1), `${token}0`])
      expect(isHitToken('a', '/old', bad)).toBe(false);
  });
});
