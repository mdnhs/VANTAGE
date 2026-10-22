import 'server-only';

import type { SpamReason } from '@/lib/enquiries/spam';
import { checkStamp } from '@/server/lib/enquiries/stamp';

// Why a public submission looks automated, or null when it looks human. A filled hidden
// field wins over the stamp result; a present but invalid or too-fresh stamp is spam.
export function classifySubmission(body: { website?: string; stamp?: string }, now = Date.now()): SpamReason | null {
  if (body.website && body.website.trim() !== '') return 'honeypot';
  // No stamp at all means the stamp fetch failed on the visitor's side: fail open, record nothing.
  if (!body.stamp) return null;
  const stamp = checkStamp(body.stamp, now);
  return stamp === 'ok' ? null : stamp;
}
