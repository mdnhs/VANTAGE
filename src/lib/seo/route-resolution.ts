import { LIVE_PATHS } from '@/lib/seo/public-pages';
import type { RedirectStatus } from '@/lib/seo/redirect-rules';

export type RedirectTable = Record<string, { destination: string; statusCode: RedirectStatus }>;
export type Resolution = { kind: 'pass' } | { kind: 'redirect'; destination: string; statusCode: RedirectStatus };

// A live page always wins; then an active redirect; everything else passes through.
export function resolvePath(table: RedirectTable, path: string): Resolution {
  if (LIVE_PATHS.has(path)) return { kind: 'pass' };
  const hit = Object.hasOwn(table, path) ? table[path] : undefined;
  if (hit) return { kind: 'redirect', destination: hit.destination, statusCode: hit.statusCode };
  return { kind: 'pass' };
}
