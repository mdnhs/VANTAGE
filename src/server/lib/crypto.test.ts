import { afterEach, describe, expect, it, vi } from 'vitest';

import { derivedHmac, hashIp } from '@/server/lib/crypto';

afterEach(() => vi.unstubAllEnvs());

describe('hashIp', () => {
  it('is stable, opaque and never the raw address', () => {
    const hash = hashIp('203.0.113.7');
    expect(hash).toBe(hashIp('203.0.113.7'));
    expect(hash).not.toContain('203.0.113.7');
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
    expect(hashIp('203.0.113.8')).not.toBe(hash);
  });
});

describe('derivedHmac', () => {
  it('is stable, hex, and domain-separated by label', () => {
    const mac = derivedHmac('a', 'value');
    expect(mac).toMatch(/^[0-9a-f]{64}$/);
    expect(derivedHmac('a', 'value')).toBe(mac);
    expect(derivedHmac('b', 'value')).not.toBe(mac);
    expect(derivedHmac('a', 'other')).not.toBe(mac);
  });
  it('changes with the server secret', () => {
    const before = derivedHmac('a', 'value');
    vi.stubEnv('AUTH_SECRET', 'another-secret-0123456789-abcdefghijkl');
    expect(derivedHmac('a', 'value')).not.toBe(before);
  });
});
