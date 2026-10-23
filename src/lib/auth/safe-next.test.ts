import { describe, expect, it } from 'vitest';

import { safeNext } from './safe-next';

describe('safeNext', () => {
  it('keeps dashboard paths with query and hash', () => {
    expect(safeNext('/dashboard/quotes?a=1#x')).toBe('/dashboard/quotes?a=1#x');
    expect(safeNext('/dashboard')).toBe('/dashboard');
  });

  it.each([
    null,
    undefined,
    '',
    '//evil.com',
    '/\\evil',
    'https://evil.com',
    '/about',
    '/dashboardx',
    '/dashboard/../about',
    '/dash\nboard',
  ])('falls back for %s', (value) => {
    expect(safeNext(value)).toBe('/dashboard');
  });
});
