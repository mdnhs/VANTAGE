// lib/theme/checks.ts
import { buildAdminTokens } from './admin';
import { contrast, formatOklch, nudge, parseColor, type Oklch } from './color';
import type { ThemeConfigValue } from './schema';
import { resolveSiteTokens } from './site';
import type { AdminToken, SiteToken } from './tokens';

type Min = 3 | 4.5;
type Scope = 'site' | 'admin-light' | 'admin-dark';
export type ContrastIssue = {
  scope: Scope;
  text: string;
  surface: string;
  ratio: number;
  min: Min;
};
export type PairRating = ContrastIssue & { rating: 'AAA' | 'AA' | 'fail' };

// Fixed pseudo-tokens: the public site draws on fixed dark surfaces with
// white text on brand, so these never move; the brand token does.
export const SITE_SURFACE = '#131313';
export const ON_BRAND = '#ffffff';

// Rulings 4: the pairs today's marketing components draw.
export const SITE_PAIRS: [SiteToken | 'on-brand', SiteToken | 'surface', Min][] = [
  ['on-brand', 'brand', 4.5],
  ['on-brand', 'brand-hover', 4.5],
  ['brand', 'surface', 3],
  ['brand-soft', 'surface', 4.5],
  ['brand-mid', 'surface', 4.5],
];

// MK's pairs, except primary on sidebar needs 3 (Ruling 5): VANTAGE red
// #dc2626 on #f2f3f2 is 4.34:1 and is only an active icon/indicator
// (WCAG 1.4.11).
export const ADMIN_PAIRS: [AdminToken, AdminToken, Min][] = [
  ['foreground', 'background', 4.5],
  ['foreground', 'card', 4.5],
  ['foreground', 'sidebar', 4.5],
  ['muted-foreground', 'card', 4.5],
  ['muted-foreground', 'sidebar', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['primary', 'card', 4.5],
  ['primary', 'sidebar', 3],
  ['accent-foreground', 'accent', 4.5],
  ['success', 'success-soft', 4.5],
  ['warning', 'warning-soft', 4.5],
  ['danger', 'danger-soft', 4.5],
  ['hero-foreground', 'hero-to', 4.5],
  ['promo-foreground', 'promo-to', 4.5],
  ['input', 'sidebar', 3],
  ['input', 'card', 3],
  ['input', 'background', 3],
];

const SITE_LABELS: Record<SiteToken | 'on-brand' | 'surface', string> = {
  brand: 'Brand',
  'brand-hover': 'Brand hover',
  'brand-soft': 'Error text',
  'brand-mid': 'Gradient mid',
  'brand-pale': 'Gradient end',
  'on-brand': 'Text on brand',
  surface: 'Page background',
};
const ADMIN_LABELS: Partial<Record<AdminToken, string>> = {
  foreground: 'Text',
  background: 'Canvas',
  card: 'Cards',
  sidebar: 'Panels',
  'muted-foreground': 'Muted text',
  primary: 'Primary',
  'primary-foreground': 'Text on primary',
  accent: 'Accent',
  'accent-foreground': 'Text on accent',
  success: 'Success text',
  'success-soft': 'Success fill',
  warning: 'Warning text',
  'warning-soft': 'Warning fill',
  danger: 'Danger text',
  'danger-soft': 'Danger fill',
  'hero-foreground': 'Hero text',
  'hero-to': 'Hero card',
  'promo-foreground': 'Promo text',
  'promo-to': 'Promo card',
  input: 'Control edges',
};

export function tokenLabel(scope: Scope, token: string): string {
  return scope === 'site'
    ? (SITE_LABELS[token as keyof typeof SITE_LABELS] ?? token)
    : (ADMIN_LABELS[token as AdminToken] ?? token);
}

export function rating(ratio: number, min: Min): 'AAA' | 'AA' | 'fail' {
  if (ratio < min) return 'fail';
  return ratio >= (min === 3 ? 4.5 : 7) ? 'AAA' : 'AA';
}

const siteColours = (config: ThemeConfigValue): Record<string, Oklch> => ({
  ...resolveSiteTokens(config.site),
  surface: parseColor(SITE_SURFACE)!,
  'on-brand': parseColor(ON_BRAND)!,
});

export function pairRatings(config: ThemeConfigValue): PairRating[] {
  const rows: PairRating[] = [];
  const add = (scope: Scope, t: Record<string, Oklch>, pairs: [string, string, Min][]) => {
    for (const [text, surface, min] of pairs) {
      const ratio = contrast(t[text]!, t[surface]!);
      rows.push({
        scope,
        text,
        surface,
        ratio,
        min,
        rating: rating(ratio, min),
      });
    }
  };
  add('site', siteColours(config), SITE_PAIRS);
  add('admin-light', buildAdminTokens(config.admin, 'light'), ADMIN_PAIRS);
  add('admin-dark', buildAdminTokens(config.admin, 'dark'), ADMIN_PAIRS);
  return rows;
}

export function checkTheme(config: ThemeConfigValue): ContrastIssue[] {
  return pairRatings(config)
    .filter((r) => r.rating === 'fail')
    .map(({ scope, text, surface, ratio, min }) => ({
      scope,
      text,
      surface,
      ratio,
      min,
    }));
}

const SCOPE_PREFIX: Record<Scope, string> = {
  site: '',
  'admin-light': 'Admin (light): ',
  'admin-dark': 'Admin (dark): ',
};

// Floors to 2 places, so a failing 4.499 never prints as '4.50'.
export function describeIssue(issue: ContrastIssue): string {
  const ratio = (Math.floor(issue.ratio * 100) / 100).toFixed(2);
  const use = issue.min === 3 ? 'large text and controls' : 'body text';
  return `${SCOPE_PREFIX[issue.scope]}${tokenLabel(issue.scope, issue.text)} on ${tokenLabel(issue.scope, issue.surface)} is ${ratio}:1; it needs ${issue.min}:1 (${use}).`;
}

const stillFails = (config: ThemeConfigValue, issue: ContrastIssue) =>
  checkTheme(config).some((i) => i.scope === issue.scope && i.text === issue.text && i.surface === issue.surface);

export function fixIssue(config: ThemeConfigValue, issue: ContrastIssue): ThemeConfigValue | null {
  if (issue.scope === 'site') {
    const tokens = siteColours(config);
    // The fixed side (white text, page background) never moves.
    const textIsFixed = issue.text === 'on-brand';
    const moving = (textIsFixed ? issue.surface : issue.text) as SiteToken;
    const fixedToken = textIsFixed ? issue.text : issue.surface;
    const next = nudge(tokens[moving]!, tokens[fixedToken]!, issue.min);
    if (!next) return null;
    const value = formatOklch(next);
    const site =
      moving === 'brand'
        ? { ...config.site, brand: value }
        : { ...config.site, tokens: { ...config.site.tokens, [moving]: value } };
    return { ...config, site };
  }
  const touches = (names: string[]) => names.includes(issue.text) || names.includes(issue.surface);
  const field = touches(['primary', 'sidebar-primary', 'primary-foreground', 'ring'])
    ? 'primary'
    : touches(['accent', 'accent-foreground'])
      ? 'accent'
      : null;
  if (!field) return null;
  const mode = issue.scope === 'admin-light' ? 'light' : 'dark';
  const start =
    (config.admin[field] && parseColor(config.admin[field]!)) || buildAdminTokens(config.admin, 'light')[field];
  // Darken for a light-mode failure, lighten for a dark one.
  const step = mode === 'light' ? -0.01 : 0.01;
  for (let i = 1; i <= 60; i++) {
    const l = start.l + step * i;
    if (l < 0 || l > 1) break;
    const candidate = {
      ...config,
      admin: { ...config.admin, [field]: formatOklch({ ...start, l }) },
    };
    if (!stillFails(candidate, issue)) return candidate;
  }
  return null;
}

// Greedy and never worse: a fix is kept only when the number of failing
// pairs does not rise, so one repair cannot break three other pairs. The
// best theme seen is returned, whatever order the fixes were tried in.
export function fixAll(config: ThemeConfigValue) {
  let current = config;
  let issues = checkTheme(current);
  let best = { config, remaining: issues };
  const seen = new Set([JSON.stringify(config)]);
  for (let round = 0; round < 40 && issues.length > 0; round++) {
    let accepted: {
      config: ThemeConfigValue;
      remaining: ContrastIssue[];
    } | null = null;
    for (const issue of issues) {
      const candidate = fixIssue(current, issue);
      if (!candidate) continue;
      const key = JSON.stringify(candidate);
      if (seen.has(key)) continue;
      seen.add(key);
      const remaining = checkTheme(candidate);
      if (remaining.length > issues.length) continue;
      // Prefer the first fix that clears a pair outright.
      if (!accepted || remaining.length < accepted.remaining.length) accepted = { config: candidate, remaining };
      if (remaining.length < issues.length) break;
    }
    if (!accepted) break;
    current = accepted.config;
    issues = accepted.remaining;
    if (issues.length < best.remaining.length) best = { config: current, remaining: issues };
  }
  return best;
}
