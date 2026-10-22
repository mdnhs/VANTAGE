import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_FONTS, SITE_FONTS } from './fonts';
import { SITE_THEME_DEFAULTS } from './presets';
import { DEFAULT_THEME } from './schema';
import { brandRgb } from './site';
import { SITE_TOKENS } from './tokens';

const CSS = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

// The plain `@theme {` block that declares --color-brand.
const themeBlock = (() => {
  const marker = CSS.indexOf('--color-brand:');
  const start = CSS.lastIndexOf('@theme', marker);
  return {
    header: CSS.slice(start, CSS.indexOf('{', start)),
    body: CSS.slice(CSS.indexOf('{', start), CSS.indexOf('}', marker)),
  };
})();
const decl = (body: string, name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(body)?.[1]?.trim();

describe('globals.css site theme defaults', () => {
  it('is a plain @theme block, not inline', () => {
    expect(themeBlock.header.trim()).toBe('@theme');
  });

  it.each(SITE_TOKENS)('--color-%s equals the theme default', (token) => {
    expect(decl(themeBlock.body, `--color-${token}`)).toBe(SITE_THEME_DEFAULTS[token]);
  });

  it('--brand-rgb in :root equals the default glow channel', () => {
    const root = CSS.slice(CSS.indexOf(':root {'), CSS.indexOf('}', CSS.indexOf(':root {')));
    expect(decl(root, '--brand-rgb')).toBe(brandRgb(DEFAULT_THEME.site).join(' '));
  });

  it('font slots default to the catalogue variables', () => {
    expect(decl(themeBlock.body, '--font-site-heading')).toBe(`var(${SITE_FONTS[DEFAULT_FONTS.heading].variable})`);
    expect(decl(themeBlock.body, '--font-site-body')).toBe(`var(${SITE_FONTS[DEFAULT_FONTS.body].variable})`);
  });
});
