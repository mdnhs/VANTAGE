import type { Permissions } from '@/lib/auth/permissions';

// Registered into global-access.ts with one-line spreads.
export const MARKETING_EDITABLE_KEYS = ['consent', 'scripts'] as const;

type Access = { read: Permissions; update: Permissions };

export const MARKETING_GLOBAL_ACCESS = {
  consent: { read: { tracking: ['read'] }, update: { tracking: ['update'] } },
  // Owner only: `code.update` is the one permission the admin role lacks.
  scripts: { read: { code: ['update'] }, update: { code: ['update'] } },
} as const satisfies Record<(typeof MARKETING_EDITABLE_KEYS)[number], Access>;

export const MARKETING_GLOBAL_LABELS = {
  consent: 'Consent banner',
  scripts: 'Custom code',
} as const satisfies Record<(typeof MARKETING_EDITABLE_KEYS)[number], string>;
