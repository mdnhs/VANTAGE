import * as z from 'zod';

import { isReservedPath, LIVE_PATHS, RESERVED_PREFIXES } from '@/lib/seo/public-pages';

export const REDIRECT_STATUSES = [301, 302, 307, 308] as const;
export type RedirectStatus = (typeof REDIRECT_STATUSES)[number];

// Stored exactly as the proxy sees request.nextUrl.pathname: URL-safe characters only,
// no query, no trailing slash.
export const RedirectSource = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v.length > 1 ? v.replace(/\/+$/, '') : v))
  .refine((v) => /^\/[A-Za-z0-9\-._~%/]*$/.test(v) && !v.startsWith('//'), 'Use a path on this site, e.g. /old-page')
  // Dot segments would never match what the proxy sees (the URL parser collapses them).
  .refine((v) => !/(?:^|\/)(?:\.|\.\.|%2e|%2e\.|\.%2e|%2e%2e)(?:\/|$)/i.test(v), 'Use a path on this site, e.g. /old-page')
  .refine((v) => v !== '/', "The home page can't redirect")
  .refine((v) => !LIVE_PATHS.has(v), 'That address is a live page')
  .refine((v) => !isReservedPath(v), 'That address is reserved');

// The destination as the proxy will see it: dot segments collapsed, no trailing slash
// (except "/"), query kept.
function canonicalDestination(v: string): string {
  const url = new URL(v, 'http://x');
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') || '/' : url.pathname;
  return path + url.search;
}

// Destinations may be live pages and legacy pages, but never the app's own areas (API, admin,
// auth pages, /_next, /uploads). Only those prefixes are blocked: a file path such as /brochure.pdf is fine.
function isAppPath(v: string): boolean {
  let path = v.split(/[?#]/, 1)[0]!;
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  path = path.toLowerCase();
  return RESERVED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

// Site paths only, optionally with a query string.
export const RedirectDestination = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^\/(?![/\\])[^\s\\#]*$/.test(v), 'Use a path on this site, e.g. /new-page')
  .transform(canonicalDestination)
  .refine((v) => /^\/(?![/\\])/.test(v), 'Use a path on this site, e.g. /new-page')
  .refine((v) => !isAppPath(v), "That address belongs to the app and can't be a destination");

const Status = z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]);

export const RedirectInput = z.object({
  sourcePath: RedirectSource,
  destination: RedirectDestination,
  statusCode: Status.default(301),
  note: z.string().trim().max(200).default(''),
});
export type RedirectInput = z.infer<typeof RedirectInput>;

export const RedirectPatch = z
  .object({
    destination: RedirectDestination.optional(),
    statusCode: Status.optional(),
    isActive: z.boolean().optional(),
    note: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to change');
export type RedirectPatch = z.infer<typeof RedirectPatch>;

export const RedirectListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type RedirectListQuery = z.infer<typeof RedirectListQuery>;

export type RedirectDto = {
  id: string;
  sourcePath: string;
  destination: string;
  statusCode: RedirectStatus;
  isActive: boolean;
  hitCount: number;
  lastHitAt: string | null;
  note: string;
  updatedAt: string;
};
