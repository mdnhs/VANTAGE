import 'server-only';

import { timingSafeEqual } from 'node:crypto';

import { derivedHmac } from '@/server/lib/crypto';

export const STAMP_MIN_MS = 3_000;
export const STAMP_MAX_MS = 7 * 86_400_000;

// Signed with the server secret. A missing or short AUTH_SECRET makes the stamp unavailable:
// the form is then accepted (fail open), never marked as spam on that ground.
const sign = (ms: string): string | null => {
  try {
    return derivedHmac('enquiry-stamp', ms).slice(0, 32);
  } catch {
    return null;
  }
};

// `<issued-at ms>.<mac>`; empty when stamps are unavailable.
export const issueStamp = (now = Date.now()): string => {
  const mac = sign(String(now));
  return mac ? `${now}.${mac}` : '';
};

export function checkStamp(stamp: string | undefined, now = Date.now()): 'ok' | 'stamp' | 'too-fast' {
  if (sign('0') === null) return 'ok';
  const [ms, mac] = (stamp ?? '').split('.');
  if (!ms || !mac || !/^\d{13}$/.test(ms)) return 'stamp';
  const expected = Buffer.from(sign(ms) ?? '');
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'stamp';
  const age = now - Number(ms);
  if (age < 0 || age > STAMP_MAX_MS) return 'stamp';
  return age < STAMP_MIN_MS ? 'too-fast' : 'ok';
}
