import { describe, expect, it, vi } from 'vitest';

import { adminThemeCss, liveDeclarations, siteThemeCss, toCss } from './css';
import { DEFAULT_THEME, parseTheme, ThemeConfig } from './schema';

const SAFE = /^[a-z0-9\-:;(){}.[\]="\s]*$/i;
const site = (value: object) => ThemeConfig.parse({ site: value }).site;
const admin = (value: object) => ThemeConfig.parse({ admin: value }).admin;

describe('siteThemeCss', () => {
  it('emits nothing for the default theme', () => {
    expect(siteThemeCss(DEFAULT_THEME.site)).toBe('');
  });

  it('emits changed colours as :root overrides plus the glow channel', () => {
    const css = siteThemeCss(site({ brand: '#2563eb' }));
    expect(css.startsWith(':root{--color-brand:oklch(')).toBe(true);
    expect(css).toContain('--brand-rgb:37 99 235');
    expect(css).not.toContain('--font');
    expect(css).toMatch(SAFE);
    expect(css).not.toContain('NaN');
  });

  it('a font change alone emits exactly one font declaration', () => {
    expect(siteThemeCss(site({ fonts: { heading: 'sora' } }))).toBe(':root{--font-site-heading:var(--font-sora)}');
  });

  it('the default fonts emit nothing', () => {
    expect(siteThemeCss(site({ fonts: { heading: 'manrope', body: 'inter' } }))).toBe('');
  });

  it('no NaN for black, white and greys', () => {
    for (const brand of ['#000000', '#ffffff', '#808080']) {
      const css = siteThemeCss(site({ brand }));
      expect(css).not.toContain('NaN');
      expect(css).toMatch(SAFE);
    }
  });
});

describe('adminThemeCss', () => {
  it('emits nothing for the default admin', () => {
    expect(adminThemeCss(DEFAULT_THEME.admin)).toBe('');
  });

  it('scopes light and dark separately', () => {
    const css = adminThemeCss(admin({ preset: 'ocean', primary: '#2f5f8a' }));
    expect(css).toContain(':root:has([data-admin-root]){');
    expect(css).toContain(':root:has([data-admin-root]).dark{');
    expect(css).toMatch(SAFE);
  });

  it('a preset alone changes the colours', () => {
    const css = adminThemeCss(admin({ preset: 'ocean' }));
    expect(css).toContain(':root:has([data-admin-root]){');
    expect(css).toContain(':root:has([data-admin-root]).dark{');
  });

  it('emits the radius', () => {
    expect(adminThemeCss(admin({ radius: 1 }))).toContain('--radius:1rem');
  });
});

describe('toCss', () => {
  it("drops a token name like 'x;}'", () => {
    const color = { l: 0.5, c: 0.1, h: 20 };
    expect(toCss(':root', { 'x;}': color })).toBe('');
    expect(toCss(':root', { 'x;}': color, ok: color })).toBe(':root{--ok:oklch(0.5 0.1 20)}');
  });
});

describe('liveDeclarations', () => {
  it('lists every admin token and the radius', () => {
    const decls = liveDeclarations(DEFAULT_THEME.admin, 'light');
    expect(decls).toContainEqual(['--radius', '0.75rem']);
    expect(decls.find(([n]) => n === '--primary')?.[1]).toMatch(/^oklch\(/);
  });
});

describe('schema safety', () => {
  const MALICIOUS = [
    '#fff;}</style>',
    'red;}</style><script>alert(1)</script>',
    'oklch(0.5 0.1 200);}',
    'var(--x)',
    'red',
  ];

  it.each(MALICIOUS)('rejects %s at parse', (value) => {
    expect(ThemeConfig.safeParse({ site: { brand: value } }).success).toBe(false);
    expect(ThemeConfig.safeParse({ site: { tokens: { 'brand-hover': value } } }).success).toBe(false);
    expect(ThemeConfig.safeParse({ admin: { primary: value } }).success).toBe(false);
    expect(ThemeConfig.safeParse({ admin: { accent: value } }).success).toBe(false);
  });

  it('rejects unknown token names, the brand lock and unknown fonts', () => {
    expect(ThemeConfig.safeParse({ site: { tokens: { 'x}</style>': '#000000' } } }).success).toBe(false);
    expect(ThemeConfig.safeParse({ site: { tokens: { brand: '#000000' } } }).success).toBe(false);
    expect(ThemeConfig.safeParse({ site: { fonts: { heading: 'comic-sans' } } }).success).toBe(false);
  });

  it('parseTheme falls back to the default on drift', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseTheme({ site: { brand: 42 } })).toBe(DEFAULT_THEME);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
    expect(parseTheme(undefined)).toEqual(DEFAULT_THEME);
  });
});
