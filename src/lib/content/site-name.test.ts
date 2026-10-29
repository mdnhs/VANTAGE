import { describe, expect, it } from 'vitest';

import { siteNameFrom } from './site-name';

describe('siteNameFrom', () => {
  it('uses the admin name, trimmed', () => {
    expect(siteNameFrom('  Auto Paint Shop ', 'https://x.ie')).toBe('Auto Paint Shop');
  });

  it('falls back to the domain without www, then to a generic word', () => {
    expect(siteNameFrom('', 'https://www.autopaintshop.ie')).toBe('autopaintshop.ie');
    expect(siteNameFrom(null, 'not a url')).toBe('Website');
  });
});
