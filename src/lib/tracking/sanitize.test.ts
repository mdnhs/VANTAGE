import { describe, expect, it } from 'vitest';

import {
  COLLAPSE,
  META_ROUTES,
  metaAllowed,
  pixelAllowed,
  metaSourceUrl,
  pageTitle,
  sanitizePath,
  sanitizeUrl,
} from './sanitize';

const SITE = 'https://vantageautobody.ie';

describe('sanitizeUrl', () => {
  it.each([
    ['/contact?topic=repair', `${SITE}/contact`],
    ['/contact#form', `${SITE}/contact`],
    ['/services/collision-repair/', `${SITE}/services/collision-repair/`],
    ['/', `${SITE}/`],
    [`${SITE}/about?utm_source=x`, `${SITE}/about`],
    ['https://www.google.com/search?q=car+repair', 'https://www.google.com/search'],
  ])('%s -> %s', (input, expected) => {
    expect(sanitizeUrl(input, SITE)).toBe(expected);
  });

  it('returns an empty string for something that is not a URL', () => {
    expect(sanitizeUrl('http://[::1', SITE)).toBe('');
    expect(sanitizeUrl('', SITE)).toBe('');
  });

  it('returns a safe value for protocol-relative and script URLs', () => {
    for (const bad of [
      '//evil.example/about/x',
      '//host',
      '\\\\host',
      'javascript:alert(1)',
      'data:text/html,x',
      'JavaScript:alert(1)',
    ]) {
      expect(sanitizeUrl(bad, SITE)).toBe('');
      expect(sanitizeUrl(bad)).toBe('');
    }
  });

  it('keeps every path as is while no path family is collapsed', () => {
    expect(COLLAPSE).toEqual([]);
    expect(sanitizePath('/services')).toBe('/services');
    expect(sanitizePath('/Services/x')).toBe('/Services/x');
  });
});

describe('pageTitle', () => {
  it('keeps the page title while no path family is collapsed', () => {
    expect(pageTitle('/about', 'About | VANTAGE')).toBe('About | VANTAGE');
  });
});

describe('metaAllowed', () => {
  const at = (pathname: string, search = '', hash = '') => ({
    pathname,
    search,
    hash,
  });
  it.each(META_ROUTES)('allows %s with a clean URL', (path) => {
    expect(metaAllowed(at(path))).toBe(true);
  });
  it('refuses unlisted pages and anything with a query or hash', () => {
    expect(metaAllowed(at('/services/collision-repair'))).toBe(false);
    expect(metaAllowed(at('/contact', '?topic=repair'))).toBe(false);
    expect(metaAllowed(at('/contact', '', '#form'))).toBe(false);
    expect(metaAllowed(at('/privacy'))).toBe(false);
  });
});

describe('metaSourceUrl (CAPI)', () => {
  it.each([
    ['/contact?topic=repair#form', `${SITE}/contact`],
    ['/get-a-quote?x=1', `${SITE}/get-a-quote`],
    ['/about', `${SITE}/about`],
    ['/landing-page-slug', `${SITE}/`],
    ['/services/collision-repair', `${SITE}/`],
    ['/Contact', `${SITE}/`],
    ['//evil.example/contact', ''],
  ])('%s → %s', (href, expected) => {
    expect(metaSourceUrl(href, SITE)).toBe(expected);
  });
});

describe('pixelAllowed (referrer must be neutral too)', () => {
  const here = {
    href: `${SITE}/contact`,
    pathname: '/contact',
    search: '',
    hash: '',
  };
  it.each([
    [`${SITE}/services/collision-repair`, false],
    [`${SITE}/contact?topic=y`, false],
    [`${SITE}/landing-page-slug`, false],
    ['not a url', false],
    ['https://www.google.com/search?q=x', true],
    ['', true],
    [`${SITE}/services`, true],
    [`${SITE}/`, true],
  ])('referrer %s gives %s', (referrer, expected) => {
    expect(pixelAllowed(here, referrer)).toBe(expected);
  });
  it('still requires the current URL to pass metaAllowed', () => {
    expect(pixelAllowed({ ...here, href: `${SITE}/contact?x=1`, search: '?x=1' }, '')).toBe(false);
  });
});
