// The spam model, shared by the server and the admin screens. Pure: no server imports.
export const SPAM_STATUS = 'spam';

export const SPAM_REASONS = ['honeypot', 'stamp', 'too-fast', 'manual'] as const;
export type SpamReason = (typeof SPAM_REASONS)[number];

const LABELS: Record<SpamReason, string> = {
  honeypot: 'Hidden field filled in',
  stamp: 'Form stamp missing or expired',
  'too-fast': 'Submitted too quickly',
  manual: 'Marked as spam by staff',
};

export const spamReasonLabel = (reason: string | null): string =>
  reason && Object.hasOwn(LABELS, reason) ? LABELS[reason as SpamReason] : 'Unknown';
