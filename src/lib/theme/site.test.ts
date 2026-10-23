import { describe, expect, it } from 'vitest';

import { toHex } from './color';
import { SITE_THEME_DEFAULTS } from './presets';
import { DEFAULT_THEME, ThemeConfig } from './schema';
import { brandRgb, defaultSiteTheme, resolveSiteTokens } from './site';
import { SITE_TOKENS } from './tokens';

const site = (value: object) => ThemeConfig.parse({ site: value }).site;

describe('resolveSiteTokens', () => {
  it('the default theme resolves to exactly the shipped hex values', () => {
    const tokens = resolveSiteTokens(DEFAULT_THEME.site);
    for (const t of SITE_TOKENS) expect(toHex(tokens[t])).toBe(SITE_THEME_DEFAULTS[t]);
  });

  it('a new brand moves brand-hover by the same hue delta', () => {
    const base = resolveSiteTokens(DEFAULT_THEME.site);
    const blue = resolveSiteTokens(site({ brand: '#2563eb' }));
    const brandDelta = blue.brand.h - base.brand.h;
    const hoverDelta = (((blue['brand-hover'].h - base['brand-hover'].h) % 360) + 360) % 360;
    expect(hoverDelta).toBeCloseTo((brandDelta + 360) % 360, 0);
    expect(blue['brand-hover']).not.toEqual(base['brand-hover']);
  });

  it('a locked token wins over derivation', () => {
    const tokens = resolveSiteTokens(site({ brand: '#2563eb', tokens: { 'brand-hover': '#112233' } }));
    expect(toHex(tokens['brand-hover'])).toBe('#112233');
  });
});

describe('brandRgb', () => {
  it('is the default red channel triple', () => {
    expect(brandRgb(DEFAULT_THEME.site)).toEqual([220, 38, 38]);
  });

  it('follows the brand', () => {
    expect(brandRgb(site({ brand: '#2563eb' }))).toEqual([37, 99, 235]);
  });
});

describe('defaultSiteTheme', () => {
  it('equals the parsed default and is a fresh object', () => {
    expect(defaultSiteTheme()).toEqual(DEFAULT_THEME.site);
    expect(defaultSiteTheme().tokens).not.toBe(DEFAULT_THEME.site.tokens);
  });
});
