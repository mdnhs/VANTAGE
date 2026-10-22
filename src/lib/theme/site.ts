import { parseColor, toHex, type Oklch } from './color';
import { shift } from './derive';
import { SITE_THEME_DEFAULTS } from './presets';
import { DEFAULT_THEME, type SiteThemeConfig } from './schema';
import { SITE_TOKENS, type SiteToken } from './tokens';

type SiteTokens = Record<SiteToken, Oklch>;

const BASE = Object.fromEntries(SITE_TOKENS.map((t) => [t, parseColor(SITE_THEME_DEFAULTS[t])!])) as SiteTokens;

// Non-brand tokens follow the brand the way it moved from the default red;
// a lock replaces the derived value. Stored values are canonical, but one
// that fails to parse falls back to the default so rendering never throws.
export function resolveSiteTokens(site: SiteThemeConfig): SiteTokens {
  const brand = (site.brand && parseColor(site.brand)) || BASE.brand;
  const out = Object.fromEntries(
    SITE_TOKENS.map((t) => [t, t === 'brand' ? brand : shift(BASE[t], BASE.brand, brand, true)]),
  ) as SiteTokens;
  for (const t of SITE_TOKENS) {
    if (t === 'brand') continue;
    const locked = site.tokens[t];
    const color = locked ? parseColor(locked) : null;
    if (color) out[t] = color;
  }
  return out;
}

export const SITE_DEFAULT: SiteTokens = BASE;

// The glow channel (`--brand-rgb`), always the resolved brand.
export function brandRgb(site: SiteThemeConfig): [number, number, number] {
  const hex = toHex(resolveSiteTokens(site).brand);
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

export const defaultSiteTheme = (): SiteThemeConfig => ({
  ...DEFAULT_THEME.site,
  tokens: {},
  fonts: { ...DEFAULT_THEME.site.fonts },
});
