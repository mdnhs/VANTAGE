import { describe, expect, it } from 'vitest';

import { PageSeoGlobal, SEO_PAGE_KEYS } from './globals-seo';

const canonical = (value: string) => PageSeoGlobal.safeParse({ canonical: value }).success;

describe('PageSeoGlobal', () => {
  it('defaults every field', () => {
    expect(PageSeoGlobal.parse({})).toEqual({
      title: '',
      description: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: null,
      canonical: '',
      twitterCard: 'summary_large_image',
      noindex: false,
    });
  });

  it('accepts an own-address blank, a path and an https address', () => {
    expect(canonical('')).toBe(true);
    expect(canonical('/about')).toBe(true);
    expect(canonical('/')).toBe(true);
    expect(canonical('https://x.ie/a')).toBe(true);
  });

  it('rejects trailing slashes, protocol-relative, http and query/hash addresses', () => {
    for (const bad of ['/about/', '//evil', 'http://x', '/a?b', '/a#b', '/a b', '/\\evil', 'https://']) {
      expect(canonical(bad), bad).toBe(false);
    }
  });

  it('bounds the title and description', () => {
    expect(PageSeoGlobal.safeParse({ title: 'a'.repeat(70) }).success).toBe(true);
    expect(PageSeoGlobal.safeParse({ title: 'a'.repeat(71) }).success).toBe(false);
    expect(PageSeoGlobal.safeParse({ description: 'a'.repeat(201) }).success).toBe(false);
    expect(PageSeoGlobal.safeParse({ description: 'a'.repeat(200) }).success).toBe(true);
    expect(canonical('/' + 'a'.repeat(300))).toBe(false);
    expect(PageSeoGlobal.safeParse({ twitterCard: 'player' }).success).toBe(false);
  });

  it('has one key per public page', () => {
    expect([...SEO_PAGE_KEYS]).toEqual([
      'seo.page.home',
      'seo.page.services',
      'seo.page.our-work',
      'seo.page.insurance',
      'seo.page.about',
      'seo.page.process',
      'seo.page.contact',
      'seo.page.get-a-quote',
    ]);
  });
});
