import { describe, expect, it } from 'vitest';

import { formatAddress } from './format-address';

const addr = (over: Partial<Parameters<typeof formatAddress>[0]> = {}) => ({
  lines: [] as string[],
  city: '',
  eircode: '',
  country: '',
  ...over,
});

describe('formatAddress', () => {
  it('joins lines, city, eircode and country', () => {
    expect(
      formatAddress(addr({ lines: ['10 Park Street'], city: 'Dublin', eircode: 'D02 XY45', country: 'Ireland' })),
    ).toBe('10 Park Street, Dublin, D02 XY45, Ireland');
  });

  it('does not repeat a part the address already contains', () => {
    expect(formatAddress(addr({ lines: ['10, Park Street, Ireland'], country: 'Ireland' }))).toBe(
      '10, Park Street, Ireland',
    );
    expect(formatAddress(addr({ lines: ['10 Park Street, Dublin'], city: 'dublin' }))).toBe('10 Park Street, Dublin');
  });

  it('skips blank parts and returns an empty string for no address', () => {
    expect(formatAddress(addr({ lines: ['  ', '10 Park Street'], city: ' ' }))).toBe('10 Park Street');
    expect(formatAddress(addr())).toBe('');
  });

  it('treats the country code IE and Ireland as the same country', () => {
    expect(formatAddress(addr({ lines: ['10 Park Street, Ireland'], country: 'IE' }))).toBe('10 Park Street, Ireland');
    expect(formatAddress(addr({ lines: ['10 Park Street'], city: 'Dublin', country: 'IE' }))).toBe(
      '10 Park Street, Dublin, Ireland',
    );
  });

  it('does not double the country when the last line ends with it without a comma', () => {
    expect(formatAddress(addr({ lines: ['10 Park Street Dublin Ireland'], country: 'Ireland' }))).toBe(
      '10 Park Street Dublin Ireland',
    );
  });
});
