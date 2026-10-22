import { describe, expect, it } from 'vitest';

import { checkTheme, describeIssue, fixAll, fixIssue, pairRatings, rating, SITE_PAIRS, tokenLabel } from './checks';
import { ThemeConfig, DEFAULT_THEME } from './schema';
import { resolveSiteTokens } from './site';
import { contrast } from './color';

const withSite = (site: object) => ThemeConfig.parse({ site });

describe('checkTheme', () => {
  it('the default theme has no issues', () => {
    expect(checkTheme(DEFAULT_THEME)).toEqual([]);
  });

  it('rates the default site pairs as passing with the expected ratios', () => {
    const rows = pairRatings(DEFAULT_THEME).filter((r) => r.scope === 'site');
    expect(rows.map((r) => r.ratio)).toEqual([
      expect.closeTo(4.83, 1),
      expect.closeTo(6.48, 1),
      expect.closeTo(3.85, 1),
      expect.closeTo(9.8, 1),
    ]);
    expect(rows.every((r) => r.rating !== 'fail')).toBe(true);
    expect(SITE_PAIRS).toHaveLength(4);
  });

  it('a hard-to-read brand fails white-on-brand', () => {
    const issues = checkTheme(withSite({ brand: '#ffd400' }));
    expect(issues).toContainEqual(expect.objectContaining({ scope: 'site', text: 'on-brand', surface: 'brand' }));
  });

  it('checks admin light and dark separately', () => {
    const scopes = new Set(checkTheme(ThemeConfig.parse({ admin: { primary: '#fde047' } })).map((i) => i.scope));
    expect(scopes.has('admin-light')).toBe(true);
  });

  it('labels pseudo-tokens and site tokens', () => {
    expect(tokenLabel('site', 'on-brand')).toBe('Text on brand');
    expect(tokenLabel('site', 'surface')).toBe('Page background');
    expect(tokenLabel('site', 'brand-soft')).toBe('Error text');
    expect(tokenLabel('site', 'brand-mid')).toBe('Gradient mid');
    expect(tokenLabel('site', 'brand-pale')).toBe('Gradient end');
  });
});

describe('describeIssue', () => {
  it('floors the ratio so a failing 4.499 never prints as 4.50', () => {
    const text = describeIssue({
      scope: 'site',
      text: 'on-brand',
      surface: 'brand',
      ratio: 4.499,
      min: 4.5,
    });
    expect(text).toContain('4.49:1');
    expect(text).toBe('Text on brand on Brand is 4.49:1; it needs 4.5:1 (body text).');
  });
});

describe('fix automatically', () => {
  it('fixAll clears a hard-to-read brand and keeps fonts', () => {
    const config = withSite({ brand: '#ffd400', fonts: { heading: 'sora' } });
    const fixed = fixAll(config);
    expect(fixed.remaining).toEqual([]);
    expect(checkTheme(fixed.config)).toEqual([]);
    expect(fixed.config.site.fonts.heading).toBe('sora');
  });

  it('moves the brand, never the fixed side', () => {
    const config = withSite({ brand: '#ffd400' });
    const issue = checkTheme(config).find((i) => i.text === 'on-brand' && i.surface === 'brand')!;
    const fixed = fixIssue(config, issue)!;
    expect(fixed.site.brand).not.toBe(config.site.brand);
    const tokens = resolveSiteTokens(fixed.site);
    expect(contrast({ l: 1, c: 0, h: 0 }, tokens.brand)).toBeGreaterThanOrEqual(4.5);
  });

  it('a failing admin primary is darkened', () => {
    const config = ThemeConfig.parse({ admin: { primary: '#fde047' } });
    const issue = checkTheme(config).find((i) => i.scope === 'admin-light')!;
    const fixed = fixIssue(config, issue)!;
    expect(fixed).not.toBeNull();
    const before = Number(/oklch\(([\d.]+)/.exec(config.admin.primary!)![1]);
    const after = Number(/oklch\(([\d.]+)/.exec(fixed.admin.primary!)![1]);
    expect(after).toBeLessThan(before);
  });

  it('fixAll never leaves a theme with more failing pairs', () => {
    const configs = [
      withSite({ brand: '#000000' }),
      withSite({ brand: '#ffffff' }),
      ThemeConfig.parse({ admin: { primary: '#000000', accent: '#ffff00' } }),
      ThemeConfig.parse({ admin: { primary: '#ffffff' } }),
    ];
    for (const config of configs) {
      const before = checkTheme(config).length;
      expect(checkTheme(fixAll(config).config).length).toBeLessThanOrEqual(before);
      expect(fixAll(config).remaining.length).toBeLessThanOrEqual(before);
    }
  });

  it('rates AAA, AA and fail', () => {
    expect(rating(7.1, 4.5)).toBe('AAA');
    expect(rating(4.6, 4.5)).toBe('AA');
    expect(rating(4.49, 4.5)).toBe('fail');
    expect(rating(4.6, 3)).toBe('AAA');
  });
});
