import { describe, expect, it } from 'vitest';

import { createLegalPageSchema, isSafeHref, slugify, tiptapDocSchema } from './legal-page-schema';

const doc = (...content: unknown[]) => ({ type: 'doc', content });
const linked = (href: string) =>
  doc({ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href } }] }] });

describe('tiptapDocSchema', () => {
  it('accepts headings, paragraphs, marks and safe links', () => {
    const value = doc(
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Your data' }] },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' link', marks: [{ type: 'link', attrs: { href: 'https://dpc.ie' } }] },
        ],
      },
    );
    expect(tiptapDocSchema.safeParse(value).success).toBe(true);
  });

  it('rejects node types outside the allowlist', () => {
    expect(tiptapDocSchema.safeParse(doc({ type: 'image', attrs: { src: 'x.png' } })).success).toBe(false);
  });

  it('rejects a level-1 heading', () => {
    const value = doc({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'x' }] });
    expect(tiptapDocSchema.safeParse(value).success).toBe(false);
  });

  it.each(['javascript:alert(1)', '//evil.com', 'data:text/html,x'])('rejects the link %s', (href) => {
    expect(tiptapDocSchema.safeParse(linked(href)).success).toBe(false);
  });
});

describe('isSafeHref', () => {
  it.each(['/privacy-policy', 'mailto:a@b.ie', 'tel:+35312345', 'https://dpc.ie', 'http://x.ie'])('allows %s', (href) =>
    expect(isSafeHref(href)).toBe(true),
  );

  it.each(['data:text/html,x', 'javascript:alert(1)', ' JavaScript:alert(1)', '//evil.com', '/\\evil.com', ''])(
    'refuses %s',
    (href) => expect(isSafeHref(href)).toBe(false),
  );
});

describe('slugify', () => {
  it('kebab-cases a title', () => expect(slugify('Privacy & Cookie Policy')).toBe('privacy-cookie-policy'));
  it('folds accents', () => expect(slugify('Téarmaí Úsáide')).toBe('tearmai-usaide'));
  it('caps the length at 140 without a trailing hyphen', () => {
    const slug = slugify('a'.repeat(139) + ' b');
    expect(slug.length).toBeLessThanOrEqual(140);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('createLegalPageSchema', () => {
  const base = { title: 'Privacy Policy', content: doc({ type: 'paragraph' }) };
  it('accepts a kebab-case slug', () => {
    expect(createLegalPageSchema.safeParse({ ...base, slug: 'privacy-policy' }).success).toBe(true);
  });
  it('rejects a slug that is not kebab-case', () => {
    expect(createLegalPageSchema.safeParse({ ...base, slug: 'Privacy_Policy' }).success).toBe(false);
  });
});
