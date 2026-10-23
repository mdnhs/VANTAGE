// Signed marker the proxy attaches to a resolver call that is a real, countable visit.
// Pure and `node:crypto` only, so the proxy and the API route can both import it.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const HIT_HEADER = 'x-vantage-hit';

export function hitToken(secret: string, path: string): string {
  return createHmac('sha256', secret).update(`redirect-hit:${path}`).digest('hex').slice(0, 32);
}

export function isHitToken(secret: string, path: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(hitToken(secret, path));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
