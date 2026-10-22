import { describe, expect, it } from 'vitest';

import { clip, flattenValue, TEXT_LIMIT } from './flatten';

describe('flattenValue', () => {
  it('keeps readable text and skips ids, media references and links', () => {
    const text = flattenValue({
      hero: {
        eyebrow: 'About Vantage',
        line1: 'Built on',
        image: { kind: 'media', id: '7b0b0f7e-0000-4000-8000-000000000000' },
      },
      cta: { label: 'Get a quote', href: '/quote', url: 'https://x.ie' },
      logo: 'Logo alt text',
      stat: { value: '25+', label: 'Years' },
      n: 3,
    });
    expect(text).toContain('About Vantage');
    expect(text).toContain('Built on');
    expect(text).toContain('Get a quote');
    expect(text).toContain('Years');
    expect(text).not.toMatch(/7b0b0f7e|https|\/quote|Logo alt|media/);
  });

  it('clips at 8 000 characters', () => {
    expect(TEXT_LIMIT).toBe(8000);
    expect(clip('x'.repeat(9000))).toHaveLength(8000);
    expect(flattenValue({ body: 'y'.repeat(9000) })).toHaveLength(8000);
    expect(flattenValue({ body: 'y'.repeat(50) }, 10)).toHaveLength(10);
  });

  it('tolerates junk', () => {
    expect(flattenValue(null)).toBe('');
    expect(flattenValue(42)).toBe('');
  });
});
