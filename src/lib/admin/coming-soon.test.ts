import { describe, expect, it } from 'vitest';

import { canOpen } from './nav';
import { comingSoonLink } from './coming-soon';

describe('comingSoonLink', () => {
  it('resolves a registered section and its child page', () => {
    expect(comingSoonLink('media', [])?.label).toBe('Media');
    expect(comingSoonLink('seo', ['redirects'])?.label).toBe('Redirects');
  });
  it('returns undefined (404) for unregistered sections and deep paths', () => {
    expect(comingSoonLink('nope', [])).toBeUndefined();
    expect(comingSoonLink('seo', ['redirects', 'extra'])).toBeUndefined();
    expect(comingSoonLink('quotes', ['abc', 'zzz'])).toBeUndefined();
  });
  it('carries the permission the page must enforce', () => {
    const link = comingSoonLink('marketing', ['code'])!;
    expect(canOpen(['owner'], link.permission)).toBe(true);
    expect(canOpen(['viewer'], link.permission)).toBe(false);
  });
});
