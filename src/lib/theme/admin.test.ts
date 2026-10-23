import { describe, expect, it } from 'vitest';

import { buildAdminTokens } from './admin';
import { checkTheme } from './checks';
import { ThemeConfig } from './schema';

describe('buildAdminTokens', () => {
  it('gives a custom primary an automatic foreground in both modes', () => {
    const admin = ThemeConfig.parse({ admin: { primary: '#e0b000' } }).admin;
    for (const mode of ['light', 'dark'] as const) {
      expect(buildAdminTokens(admin, mode)['primary-foreground']).toBeDefined();
    }
    expect(checkTheme(ThemeConfig.parse({ admin: { primary: '#e0b000' } })).map((i) => i.text)).not.toContain(
      'primary-foreground',
    );
  });

  it("tint 'none' greys the neutrals; 'primary' gives them its hue", () => {
    const base = ThemeConfig.parse({ admin: { primary: '#6a3f6b' } }).admin;
    const none = buildAdminTokens({ ...base, tint: 'none' }, 'light');
    const tinted = buildAdminTokens({ ...base, tint: 'primary' }, 'light');
    expect(none.sidebar.c).toBe(0);
    expect(tinted.sidebar.h).toBeCloseTo(buildAdminTokens(base, 'light').primary.h, 0);
  });

  it('a custom accent drives accent and sidebar-accent together', () => {
    const admin = ThemeConfig.parse({ admin: { accent: '#fde0ef' } }).admin;
    const t = buildAdminTokens(admin, 'light');
    expect(t.accent).toEqual(t['sidebar-accent']);
    expect(t['accent-foreground']).toEqual(t['sidebar-accent-foreground']);
  });
});
