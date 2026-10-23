// Public-site colour tokens the theme can override (globals.css @theme).
export const SITE_TOKENS = ['brand', 'brand-hover', 'brand-soft', 'brand-mid', 'brand-pale'] as const;
export type SiteToken = (typeof SITE_TOKENS)[number];

// Every site token except `brand`; the glow channel follows the brand.
export const LOCKABLE_SITE_TOKENS = ['brand-hover', 'brand-soft', 'brand-mid', 'brand-pale'] as const;

// admin.css :root:has([data-admin-root]) (minus --radius).
export const ADMIN_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'success',
  'success-soft',
  'warning',
  'warning-soft',
  'danger',
  'danger-soft',
  'skeleton',
  'hatch',
  'hero-from',
  'hero-to',
  'hero-foreground',
  'hero-chip',
  'hero-chip-foreground',
  'hero-delta',
  'promo-from',
  'promo-to',
  'promo-foreground',
] as const;
export type AdminToken = (typeof ADMIN_TOKENS)[number];
