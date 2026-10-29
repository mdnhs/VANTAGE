import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildAdminTokens, presetAdminColours } from './admin';
import { checkTheme } from './checks';
import { toHex } from './color';
import { PRESET_IDS, PRESETS, SITE_THEME_DEFAULTS, VANTAGE_ADMIN } from './presets';
import { DEFAULT_THEME, ThemeConfig } from './schema';
import { SITE_TOKENS } from './tokens';

const CSS = readFileSync(join(process.cwd(), 'src/app/(main)/(protected)/(dashboard_layout)/admin.css'), 'utf8');

function block(selector: string): string {
  const start = CSS.indexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  return CSS.slice(start, CSS.indexOf('}', start));
}

const declarations = (body: string) =>
  [...body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()] as const);

describe('admin.css parity', () => {
  it('light block equals VANTAGE_ADMIN.light and the radius', () => {
    const decls = declarations(block(':root:has([data-admin-root])'));
    const hexes = decls.filter(([, v]) => v.startsWith('#'));
    expect(hexes.length).toBe(Object.keys(VANTAGE_ADMIN.light).length);
    for (const [name, value] of hexes) {
      expect(VANTAGE_ADMIN.light[name as keyof typeof VANTAGE_ADMIN.light]).toBe(value);
    }
    expect(decls.find(([n]) => n === 'radius')?.[1]).toBe(`${VANTAGE_ADMIN.radius}rem`);
  });

  it('dark block equals VANTAGE_ADMIN.dark', () => {
    const hexes = declarations(block(':root:has([data-admin-root]).dark')).filter(([, v]) => v.startsWith('#'));
    expect(hexes.length).toBe(Object.keys(VANTAGE_ADMIN.dark).length);
    for (const [name, value] of hexes) {
      expect(VANTAGE_ADMIN.dark[name as keyof typeof VANTAGE_ADMIN.dark]).toBe(value);
    }
  });
});

describe('presets', () => {
  it('lists every site token in the defaults table', () => {
    expect(Object.keys(SITE_THEME_DEFAULTS)).toEqual([...SITE_TOKENS]);
  });

  it('vantage-red is the red admin primary', () => {
    expect(PRESETS['vantage-red']).toEqual({
      label: 'Brand red',
      admin: { primary: '#dc2626' },
    });
  });

  it.each(PRESET_IDS)('%s passes every contrast pair', (id) => {
    const config = ThemeConfig.parse({
      admin: { ...DEFAULT_THEME.admin, ...presetAdminColours(id) },
    });
    expect(checkTheme(config)).toEqual([]);
  });

  it('the default admin reproduces the admin.css tokens exactly', () => {
    for (const mode of ['light', 'dark'] as const) {
      const tokens = buildAdminTokens(DEFAULT_THEME.admin, mode);
      for (const [name, color] of Object.entries(tokens)) {
        const expected =
          mode === 'dark'
            ? (VANTAGE_ADMIN.dark[name as keyof typeof VANTAGE_ADMIN.dark] ??
              VANTAGE_ADMIN.light[name as keyof typeof VANTAGE_ADMIN.light])
            : VANTAGE_ADMIN.light[name as keyof typeof VANTAGE_ADMIN.light];
        expect(toHex(color)).toBe(expected);
      }
    }
  });
});
