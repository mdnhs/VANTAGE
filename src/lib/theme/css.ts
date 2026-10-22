import { ADMIN_DEFAULT, buildAdminTokens } from './admin';
import { formatOklch, type Oklch } from './color';
import { DEFAULT_FONTS, SITE_FONTS } from './fonts';
import { VANTAGE_ADMIN } from './presets';
import type { AdminThemeConfig, SiteThemeConfig } from './schema';
import { brandRgb, resolveSiteTokens, SITE_DEFAULT } from './site';

export const SCOPES = {
  site: ':root',
  admin: ':root:has([data-admin-root])',
  adminDark: ':root:has([data-admin-root]).dark',
} as const;
type Selector = (typeof SCOPES)[keyof typeof SCOPES];

const NAME = /^[a-z][a-z0-9-]*$/;
const finite = (c: Oklch) => [c.l, c.c, c.h].every(Number.isFinite);

// Every declaration is rebuilt from numbers or catalogue lookups: no stored
// string reaches the <style> tag.
export function toCss(selector: Selector, tokens: Record<string, Oklch>, extra: string[] = []): string {
  const decls = Object.entries(tokens)
    .filter(([name, color]) => NAME.test(name) && finite(color))
    .map(([name, color]) => `--${name}:${formatOklch(color)}`);
  const all = [...decls, ...extra];
  return all.length ? `${selector}{${all.join(';')}}` : '';
}

function changed<K extends string>(
  tokens: Record<K, Oklch>,
  base: Record<K, Oklch>,
  prefix = '',
): Record<string, Oklch> {
  return Object.fromEntries(
    (Object.keys(tokens) as K[])
      .filter((k) => formatOklch(tokens[k]) !== formatOklch(base[k]))
      .map((k) => [`${prefix}${k}`, tokens[k]]),
  );
}

// Only what differs from the globals.css defaults, so the default theme emits
// "" and default pages stay byte-identical.
export function siteThemeCss(site: SiteThemeConfig): string {
  const tokens = resolveSiteTokens(site);
  const extra: string[] = [];
  if (formatOklch(tokens.brand) !== formatOklch(SITE_DEFAULT.brand)) {
    extra.push(`--brand-rgb:${brandRgb(site).join(' ')}`);
  }
  const slots = [
    ['heading', 'heading'],
    ['body', 'body'],
  ] as const;
  for (const [slot, name] of slots) {
    const id = site.fonts[slot];
    const font = SITE_FONTS[id];
    if (font && id !== DEFAULT_FONTS[slot]) {
      extra.push(`--font-site-${name}:var(${font.variable})`);
    }
  }
  return toCss(SCOPES.site, changed(tokens, SITE_DEFAULT, 'color-'), extra);
}

const radiusDecl = (radius: number) =>
  Number.isFinite(radius) && radius >= 0 && radius <= 1.5 ? `--radius:${radius}rem` : null;

export function adminThemeCss(admin: AdminThemeConfig): string {
  const radius = admin.radius !== VANTAGE_ADMIN.radius ? radiusDecl(admin.radius) : null;
  return (
    toCss(SCOPES.admin, changed(buildAdminTokens(admin, 'light'), ADMIN_DEFAULT.light), radius ? [radius] : []) +
    toCss(SCOPES.adminDark, changed(buildAdminTokens(admin, 'dark'), ADMIN_DEFAULT.dark))
  );
}

// The Appearance page's live preview: every token, set inline on <html>.
export function liveDeclarations(admin: AdminThemeConfig, mode: 'light' | 'dark'): [string, string][] {
  const tokens = buildAdminTokens(admin, mode);
  const radius = radiusDecl(admin.radius);
  return [
    ...Object.entries(tokens).map(([name, color]) => [`--${name}`, formatOklch(color)] as [string, string]),
    ...(radius ? [['--radius', `${admin.radius}rem`] as [string, string]] : []),
  ];
}
