import type { Permissions } from '@/lib/auth/permissions';

import { MARKETING_EDITABLE_KEYS, MARKETING_GLOBAL_ACCESS, MARKETING_GLOBAL_LABELS } from './global-access-marketing';
import { SEO_PAGE_GLOBAL_ACCESS, SEO_PAGE_GLOBAL_LABELS } from './global-access-seo';
import type { GlobalKey } from './globals';
import { SEO_PAGE_KEYS } from './globals-seo';

// Every versioned global is edited through the generic globals API.
export const EDITABLE_GLOBAL_KEYS = [
  'site',
  'contact',
  'navigation',
  'footer',
  'quoteForm',
  'contactForm',
  'microcopy',
  'notifications',
  'privacy',
  'seo',
  'page.home',
  'page.services',
  'page.our-work',
  'page.insurance',
  'page.about',
  'page.process',
  ...MARKETING_EDITABLE_KEYS,
  ...SEO_PAGE_KEYS,
] as const satisfies readonly GlobalKey[];
export type EditableGlobalKey = (typeof EDITABLE_GLOBAL_KEYS)[number];

// Website page copy: saved as a draft while editing, previewed live, published on Save.
export const PREVIEWABLE_GLOBAL_KEYS = [
  'page.home',
  'page.services',
  'page.our-work',
  'page.insurance',
  'page.about',
  'page.process',
] as const satisfies readonly EditableGlobalKey[];
export type PreviewableGlobalKey = (typeof PREVIEWABLE_GLOBAL_KEYS)[number];
export const isPreviewableGlobal = (key: string): key is PreviewableGlobalKey =>
  (PREVIEWABLE_GLOBAL_KEYS as readonly string[]).includes(key);

type Access = { read: Permissions; update: Permissions };
const settingsAccess = {
  read: { settings: ['read'] },
  update: { settings: ['update'] },
} satisfies Access;
const globalsAccess = {
  read: { globals: ['read'] },
  update: { globals: ['update'] },
} satisfies Access;
const pageAccess = {
  read: { page: ['read'] },
  update: { page: ['update'] },
} satisfies Access;

export const GLOBAL_ACCESS: Record<EditableGlobalKey, Access> = {
  site: settingsAccess,
  notifications: settingsAccess,
  privacy: settingsAccess,
  contact: globalsAccess,
  navigation: globalsAccess,
  footer: globalsAccess,
  quoteForm: globalsAccess,
  contactForm: globalsAccess,
  microcopy: globalsAccess,
  seo: { read: { seo: ['read'] }, update: { seo: ['update'] } },
  'page.home': pageAccess,
  'page.services': pageAccess,
  'page.our-work': pageAccess,
  'page.insurance': pageAccess,
  'page.about': pageAccess,
  'page.process': pageAccess,
  ...MARKETING_GLOBAL_ACCESS,
  ...SEO_PAGE_GLOBAL_ACCESS,
};

// /dashboard/settings/<slug> → the documents it edits.
export const SETTINGS_PAGES = {
  identity: ['site'],
  contact: ['contact'],
  navigation: ['navigation'],
  footer: ['footer'],
  forms: ['quoteForm', 'contactForm', 'microcopy'],
  notifications: ['notifications'],
  privacy: ['privacy'],
} as const satisfies Record<string, readonly EditableGlobalKey[]>;
export type SettingsPage = keyof typeof SETTINGS_PAGES;

export const SETTINGS_PAGE_LABELS: Record<SettingsPage, string> = {
  identity: 'Identity',
  contact: 'Contact & workshop',
  navigation: 'Navigation',
  footer: 'Footer',
  forms: 'Forms & microcopy',
  notifications: 'Notifications',
  privacy: 'Privacy',
};

export const GLOBAL_LABELS: Record<EditableGlobalKey, string> = {
  site: 'Identity',
  contact: 'Contact & workshop',
  navigation: 'Navigation',
  footer: 'Footer',
  quoteForm: 'Quote form',
  contactForm: 'Contact form',
  microcopy: 'Microcopy',
  notifications: 'Notifications',
  privacy: 'Privacy',
  seo: 'SEO defaults',
  'page.home': 'Home page',
  'page.services': 'Services page',
  'page.our-work': 'Our work page',
  'page.insurance': 'Insurance page',
  'page.about': 'About page',
  'page.process': 'Process page',
  ...MARKETING_GLOBAL_LABELS,
  ...SEO_PAGE_GLOBAL_LABELS,
};
