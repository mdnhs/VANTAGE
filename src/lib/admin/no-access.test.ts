import { describe, expect, it } from 'vitest';

import { noAccessHref, noAccessLabel } from './no-access';

describe('noAccessHref', () => {
  it('has no from when the origin path is unknown', () => {
    expect(noAccessHref(null)).toBe('/dashboard/no-access');
    expect(noAccessHref(undefined)).toBe('/dashboard/no-access');
  });
  it('points at the in-panel page with the encoded origin path', () => {
    expect(noAccessHref('/dashboard/seo/redirects')).toBe('/dashboard/no-access?from=%2Fdashboard%2Fseo%2Fredirects');
  });
  it('falls back to the dashboard for an unsafe path', () => {
    expect(noAccessHref('//evil.com')).toBe('/dashboard/no-access?from=%2Fdashboard');
  });
});

describe('noAccessLabel', () => {
  it('resolves the registry label of the page, ignoring the query', () => {
    expect(noAccessLabel('/dashboard/seo/redirects?x=1')).toBe('Redirects');
    expect(noAccessLabel('/dashboard/media')).toBe('Media');
  });
  it('is undefined for an unknown or unsafe path', () => {
    expect(noAccessLabel('/dashboard/nope')).toBeUndefined();
    expect(noAccessLabel('https://evil.com')).toBeUndefined();
    expect(noAccessLabel(undefined)).toBeUndefined();
  });
});
