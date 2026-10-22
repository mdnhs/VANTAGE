import 'server-only';

import type { SpamReason } from '@/lib/enquiries/spam';
import { checkStamp } from '@/server/lib/enquiries/stamp';

// Why a public submission looks automated, or null when it looks human. A filled hidden
// field wins over the stamp result.
export function classifySubmission(body: { website?: string; stamp?: string }, now = Date.now()): SpamReason | null {
  if (body.website && body.website.trim() !== '') return 'honeypot';
  const stamp = checkStamp(body.stamp, now);
  return stamp === 'ok' ? null : stamp;
}
