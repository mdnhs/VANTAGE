import * as z from 'zod';

import { formatOklch, parseColor } from './color';
import { SITE_FONT_IDS } from './fonts';
import { PRESET_IDS } from './presets';
import { LOCKABLE_SITE_TOKENS } from './tokens';

// Hex or oklch() in, canonical oklch() out. Stored values are already
// canonical, so parsing them again is a no-op.
export const ColorValue = z
  .string()
  .max(64)
  .transform((text, ctx) => {
    const color = parseColor(text);
    if (!color) {
      ctx.addIssue({
        code: 'custom',
        message: 'Use a #rrggbb or oklch(L C H) colour',
      });
      return z.NEVER;
    }
    return formatOklch(color);
  });

export const SiteTheme = z.object({
  // null = the VANTAGE brand red.
  brand: ColorValue.nullable().default(null),
  // Locked tokens; anything absent is derived from the brand.
  tokens: z.partialRecord(z.enum(LOCKABLE_SITE_TOKENS), ColorValue).default({}),
  fonts: z
    .object({
      heading: z.enum(SITE_FONT_IDS).default('manrope'),
      body: z.enum(SITE_FONT_IDS).default('inter'),
    })
    .prefault({}),
});

export const ADMIN_RADII = [0, 0.25, 0.5, 0.75, 1, 1.25] as const;

export const AdminTheme = z.object({
  preset: z.enum(PRESET_IDS).default('vantage-red'),
  primary: ColorValue.nullable().default(null),
  accent: ColorValue.nullable().default(null),
  tint: z.enum(['preset', 'none', 'primary']).default('preset'),
  radius: z.number().min(0).max(1.5).multipleOf(0.125).default(0.75),
  mode: z.enum(['system', 'light', 'dark']).default('system'),
});

export const ThemeConfig = z.object({
  site: SiteTheme.prefault({}),
  admin: AdminTheme.prefault({}),
});
export type ThemeConfigValue = z.output<typeof ThemeConfig>;
export type SiteThemeConfig = ThemeConfigValue['site'];
export type AdminThemeConfig = ThemeConfigValue['admin'];

export const DEFAULT_THEME: ThemeConfigValue = ThemeConfig.parse({});

// Stored data can drift from the schema; rendering must never throw.
export function parseTheme(value: unknown): ThemeConfigValue {
  const parsed = ThemeConfig.safeParse(value);
  if (parsed.success) return parsed.data;
  console.warn('Invalid stored theme, using defaults', parsed.error.message);
  return structuredClone(DEFAULT_THEME);
}
