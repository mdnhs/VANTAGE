import { describe, expect, it } from 'vitest';

import { matchesSearch, normaliseSearch } from './normalize';

describe('normaliseSearch', () => {
  it('strips diacritics, lowercases and trims', () => {
    expect(normaliseSearch('  Café Zoë ')).toBe('cafe zoe');
  });
});

describe('matchesSearch', () => {
  it('matches any text by normalised substring; an empty query matches all', () => {
    expect(matchesSearch('SEO', ['Redirects', 'seo tools'])).toBe(true);
    expect(matchesSearch('cafe', ['Café'])).toBe(true);
    expect(matchesSearch('zzz', ['Café'])).toBe(false);
    expect(matchesSearch('  ', ['x'])).toBe(true);
  });
});
