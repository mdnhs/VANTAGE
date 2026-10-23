import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { internalOrigin } from './internal-origin';

describe('internalOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('INTERNAL_ORIGIN', '');
    vi.stubEnv('VERCEL', '');
    vi.stubEnv('PORT', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://shop.example.ie/path');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('INTERNAL_ORIGIN wins', () => {
    vi.stubEnv('INTERNAL_ORIGIN', 'http://10.0.0.5:4000');
    vi.stubEnv('VERCEL', '1');
    expect(internalOrigin()).toBe('http://10.0.0.5:4000');
  });
  it('uses the app URL origin on Vercel', () => {
    vi.stubEnv('VERCEL', '1');
    expect(internalOrigin()).toBe('https://shop.example.ie');
  });
  it('falls back to loopback, honouring PORT', () => {
    expect(internalOrigin()).toBe('http://127.0.0.1:3000');
    vi.stubEnv('PORT', '4123');
    expect(internalOrigin()).toBe('http://127.0.0.1:4123');
  });
});
