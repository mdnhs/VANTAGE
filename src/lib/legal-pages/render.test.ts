import { describe, expect, it } from 'vitest';

import type { TiptapDoc } from '@/validations/legal-page-schema';

import { excerptOf, renderLegalHtml } from './render';

const text = (value: string, marks?: unknown[]) => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });
const p = (...content: unknown[]) => ({ type: 'paragraph', content });
const doc = (...content: unknown[]) => ({ type: 'doc', content }) as TiptapDoc;
const link = (href: string) => [{ type: 'link', attrs: { href } }];

describe('renderLegalHtml', () => {
  it('renders headings and paragraphs', () => {
    const html = renderLegalHtml(
      doc({ type: 'heading', attrs: { level: 2 }, content: [text('Your data')] }, p(text('We keep it safe.'))),
    );
    expect(html).toBe('<h2>Your data</h2><p>We keep it safe.</p>');
  });

  it('opens external links in a new tab without an opener', () => {
    const html = renderLegalHtml(doc(p(text('DPC', link('https://dataprotection.ie')))));
    expect(html).toContain('href="https://dataprotection.ie"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it('keeps site links in the same tab', () => {
    const html = renderLegalHtml(doc(p(text('Contact', link('/contact')))));
    expect(html).toContain('href="/contact"');
    expect(html).not.toContain('target=');
  });

  it('drops an unsafe href that slipped past validation', () => {
    const html = renderLegalHtml(doc(p(text('x', link('javascript:alert(1)')))));
    expect(html).not.toContain('javascript:');
  });

  it('escapes markup typed as text', () => {
    expect(renderLegalHtml(doc(p(text('<script>alert(1)</script>'))))).toContain('&lt;script&gt;');
  });

  it('renders nothing for a document outside the allowlist', () => {
    expect(renderLegalHtml(doc({ type: 'image', attrs: { src: 'x.png' } }))).toBe('');
  });
});

describe('excerptOf', () => {
  it('joins the text of the opening blocks', () => {
    expect(excerptOf(doc({ type: 'heading', attrs: { level: 2 }, content: [text('Intro')] }, p(text('Body.'))))).toBe(
      'Intro Body.',
    );
  });

  it('cuts at a word boundary within the limit', () => {
    const excerpt = excerptOf(doc(p(text('word '.repeat(60)))), 160);
    expect(excerpt.length).toBeLessThanOrEqual(161);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt).not.toMatch(/\s…$/);
  });
});
