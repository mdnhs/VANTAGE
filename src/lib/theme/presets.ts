import type { AdminToken, SiteToken } from './tokens';

export const PRESET_IDS = ['vantage-red', 'evergreen', 'teal-sage', 'ocean', 'plum', 'terracotta', 'graphite'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

// Today's public-site red family, copied from the marketing code
// (src/app/globals.css keeps the same values as @theme defaults).
export const SITE_THEME_DEFAULTS: Record<SiteToken, string> = {
  brand: '#dc2626',
  'brand-hover': '#b91c1c',
  'brand-soft': '#fca5a5',
  'brand-mid': '#f0605f',
  'brand-pale': '#ffd9d9',
};

// VANTAGE admin palette, verbatim from admin.css (presets.test.ts keeps them
// equal). Dark lists only what the .dark block overrides; everything else
// falls back to light, as in CSS.
export const VANTAGE_ADMIN: {
  radius: number;
  light: Record<AdminToken, string>;
  dark: Partial<Record<AdminToken, string>>;
} = {
  radius: 0.75,
  light: {
    background: '#ffffff',
    foreground: '#111411',
    card: '#ffffff',
    'card-foreground': '#111411',
    popover: '#ffffff',
    'popover-foreground': '#111411',
    primary: '#dc2626',
    'primary-foreground': '#ffffff',
    secondary: '#e9ece9',
    'secondary-foreground': '#111411',
    muted: '#eef0ee',
    'muted-foreground': '#666c67',
    accent: '#fdecec',
    'accent-foreground': '#7f1d1d',
    destructive: '#dc2626',
    border: '#e5e8e5',
    input: '#7d867e',
    ring: '#ef4444',
    'chart-1': '#b91c1c',
    'chart-2': '#dc2626',
    'chart-3': '#ef4444',
    'chart-4': '#7f1d1d',
    'chart-5': '#fca5a5',
    sidebar: '#f2f3f2',
    'sidebar-foreground': '#111411',
    'sidebar-primary': '#dc2626',
    'sidebar-primary-foreground': '#ffffff',
    'sidebar-accent': '#fdecec',
    'sidebar-accent-foreground': '#7f1d1d',
    'sidebar-border': '#e5e8e5',
    'sidebar-ring': '#ef4444',
    success: '#15803d',
    'success-soft': '#dcfce7',
    warning: '#b45309',
    'warning-soft': '#fef3c7',
    danger: '#b91c1c',
    'danger-soft': '#fee2e2',
    skeleton: '#e2e6e2',
    hatch: '#f4a3a3',
    'hero-from': '#3a0d0d',
    'hero-to': '#7f1d1d',
    'hero-foreground': '#ffffff',
    'hero-chip': '#ffffff',
    'hero-chip-foreground': '#111411',
    'hero-delta': '#fecaca',
    'promo-from': '#120707',
    'promo-to': '#3a0d0d',
    'promo-foreground': '#ffffff',
  },
  dark: {
    background: '#0c100d',
    foreground: '#eef2ee',
    card: '#1c251f',
    'card-foreground': '#eef2ee',
    popover: '#1c251f',
    'popover-foreground': '#eef2ee',
    primary: '#f05252',
    'primary-foreground': '#1a0505',
    secondary: '#1c241e',
    'secondary-foreground': '#eef2ee',
    muted: '#1c241e',
    'muted-foreground': '#9aa39c',
    accent: '#3a1414',
    'accent-foreground': '#fecaca',
    destructive: '#f87171',
    border: '#243026',
    input: '#667369',
    ring: '#f87171',
    'chart-1': '#f87171',
    'chart-2': '#ef4444',
    'chart-3': '#fca5a5',
    'chart-4': '#b91c1c',
    'chart-5': '#7f1d1d',
    sidebar: '#141b16',
    'sidebar-foreground': '#eef2ee',
    'sidebar-primary': '#f05252',
    'sidebar-primary-foreground': '#1a0505',
    'sidebar-accent': '#3a1414',
    'sidebar-accent-foreground': '#fecaca',
    'sidebar-border': '#243026',
    'sidebar-ring': '#f87171',
    success: '#4ade80',
    'success-soft': '#12301c',
    warning: '#fbbf24',
    'warning-soft': '#33270c',
    danger: '#f87171',
    'danger-soft': '#3a1414',
    skeleton: '#2a352d',
    'hero-chip': '#ffffff',
    'hero-chip-foreground': '#111411',
    'hero-delta': '#fecaca',
    hatch: '#7f1d1d',
  },
};

// Each preset is one shift from the VANTAGE admin table. `vantage-red` is the
// default (= admin.css); the rest are MK's admin primaries.
export const PRESETS: Record<PresetId, { label: string; admin: { primary: string } }> = {
  'vantage-red': { label: 'Brand red', admin: { primary: '#dc2626' } },
  evergreen: { label: 'Evergreen', admin: { primary: '#157d38' } },
  'teal-sage': { label: 'Teal Sage', admin: { primary: '#336060' } },
  ocean: { label: 'Ocean', admin: { primary: '#2f5f8a' } },
  plum: { label: 'Plum', admin: { primary: '#6a3f6b' } },
  terracotta: { label: 'Terracotta', admin: { primary: '#9a4a32' } },
  graphite: { label: 'Graphite', admin: { primary: '#4a4f55' } },
};
