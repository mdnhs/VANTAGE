import { describe, expect, it } from 'vitest';

import { documentTitle, effectiveTemplate } from './title';

const d = { titleTemplate: '', siteName: 'Vantage Autobody' };

describe('documentTitle', () => {
  it('uses the site template by default', () => {
    expect(documentTitle({ id: 'services', seoTitle: '' }, d)).toBe(
      'Car Body Repair Services in Dublin | Vantage Autobody',
    );
  });

  it('applies a custom template', () => {
    expect(documentTitle({ id: 'services', seoTitle: null }, { ...d, titleTemplate: '%s — VA' })).toBe(
      'Car Body Repair Services in Dublin — VA',
    );
  });

  it('puts an SEO title through the template', () => {
    expect(documentTitle({ id: 'services', seoTitle: 'Body repairs' }, d)).toBe('Body repairs | Vantage Autobody');
  });

  it('gives home its own full title', () => {
    expect(documentTitle({ id: 'home', seoTitle: '' }, d)).toBe(
      'Vantage Autobody — Crash Repair & Car Restoration in Dublin',
    );
  });

  it('uses a home SEO title as is, without the template', () => {
    expect(documentTitle({ id: 'home', seoTitle: 'X' }, { ...d, titleTemplate: '%s — VA' })).toBe('X');
  });

  it('inserts an SEO title containing $& literally', () => {
    expect(documentTitle({ id: 'about', seoTitle: 'Cost $& more' }, d)).toBe('Cost $& more | Vantage Autobody');
  });
});

describe('effectiveTemplate', () => {
  it('falls back to "%s | <site>"', () => {
    expect(effectiveTemplate(d)).toBe('%s | Vantage Autobody');
  });
  it('keeps a template that has %s', () => {
    expect(effectiveTemplate({ ...d, titleTemplate: '%s · VA' })).toBe('%s · VA');
  });
});
