import { LIVE_PATHS } from '@/lib/seo/public-pages';
import type { RedirectStatus } from '@/lib/seo/redirect-rules';

export type RedirectTable = Record<string, { destination: string; statusCode: RedirectStatus }>;
export type Resolution =
  { kind: 'pass' } | { kind: 'redirect'; destination: string; statusCode: RedirectStatus } | { kind: 'missing' };

// A single-segment address is either a live page, a redirect, a published legal page (served by
// the root [slug] route) or nothing. Saying "missing" lets the proxy answer a real 404: the [slug]
// route streams its shell first, so its own notFound() could only send a soft 404.
const SINGLE_SEGMENT = /^\/[^/]+$/;

// A live page always wins; then an active redirect; everything else passes through, except a
// single-segment address that is no published legal page. `legalSlugs` null (unknown) fails open.
export function resolvePath(
  table: RedirectTable,
  path: string,
  legalSlugs: ReadonlySet<string> | null = null,
): Resolution {
  if (LIVE_PATHS.has(path)) return { kind: 'pass' };
  const hit = Object.hasOwn(table, path) ? table[path] : undefined;
  if (hit) return { kind: 'redirect', destination: hit.destination, statusCode: hit.statusCode };
  if (legalSlugs && SINGLE_SEGMENT.test(path) && !legalSlugs.has(path.slice(1))) return { kind: 'missing' };
  return { kind: 'pass' };
}
