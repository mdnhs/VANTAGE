// Next.js 16 (replaced middleware.ts). Cookie reads and redirects only — never a database call.
// Public paths ask the cached resolver over loopback (fails open); live and reserved paths never do.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_PATH_HEADER } from '@/lib/auth/admin-path';
import { safeNext } from '@/lib/auth/safe-next';
import { internalOrigin } from '@/lib/internal-origin';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { HIT_HEADER, hitToken } from '@/lib/seo/hit-token';
import { LIVE_PATHS, isReservedPath } from '@/lib/seo/public-pages';

// Better Auth's session cookie: `<cookiePrefix>.session_token`, with a `__Secure-` prefix
// on https (production). Presence only — the real, database-checked validation is
// requireActor() on the server, so a stale cookie lands on /login via the layout.
const SESSION_COOKIES = ['vantage.session_token', '__Secure-vantage.session_token'];
const hasSessionCookie = (request: NextRequest) => SESSION_COOKIES.some((name) => request.cookies.has(name));

const redirectTo = (path: string, request: NextRequest) => {
  const response = NextResponse.redirect(new URL(path, request.url));
  // Auth-dependent redirect — must never be cached by the browser or a CDN.
  response.headers.set('Cache-Control', 'no-store');
  return response;
};

const noindex = <T extends NextResponse>(response: T): T => {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
};

export const REDIRECT_TIMEOUT_MS = 300;
// Permanent redirects are cacheable for an hour so repeat visits skip the proxy round trip;
// temporary ones stay uncached so an edit takes effect straight away.
export const REDIRECT_CACHE_CONTROL = 'public, max-age=3600';
const PERMANENT_STATUSES = [301, 308];
const REDIRECT_STATUSES = [301, 302, 307, 308];
// Next's draft-mode cookie: an editor previewing a draft page must reach it.
const DRAFT_COOKIE = '__prerender_bypass';

// Same-site relative paths only: never "//host" or "/\host".
const isSitePath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\') &&
  // The URL parser strips tab/LF/CR, so "/\t/evil" would become "//evil".
  !/[\x00-\x20\\]/.test(value);

type Resolution = { kind: 'pass' } | { kind: 'redirect'; destination: unknown; statusCode: unknown };

// Link prefetches are not visits: they must not count as redirect hits.
export const isPrefetch = (request: NextRequest) =>
  request.headers.has('next-router-prefetch') ||
  request.headers.get('purpose') === 'prefetch' ||
  (request.headers.get('sec-purpose') ?? '').includes('prefetch');

async function resolve(pathname: string, countHit: boolean): Promise<Resolution | null> {
  try {
    const secret = process.env.AUTH_SECRET;
    const url = new URL('/api/v1/resolve', internalOrigin());
    url.searchParams.set('path', pathname);
    const res = await fetch(url, {
      cache: 'no-store',
      redirect: 'manual',
      // Signed, so only a real visit seen here (not a direct call to the public API) is counted.
      headers: countHit && secret ? { [HIT_HEADER]: hitToken(secret, pathname) } : undefined,
      signal: AbortSignal.timeout(REDIRECT_TIMEOUT_MS),
    });
    if (res.status !== 200) return null;
    const body = (await res.json()) as Resolution;
    return body && (body.kind === 'pass' || body.kind === 'redirect') ? body : null;
  } catch {
    return null;
  }
}

function redirectResponse(request: NextRequest, destination: unknown, statusCode: unknown) {
  if (!isSitePath(destination)) return null;
  if (!REDIRECT_STATUSES.includes(statusCode as number)) return null;
  const target = new URL(destination, request.url);
  if (target.origin !== request.nextUrl.origin) return null;
  // Keep the visitor's query (minus Next's RSC cache-buster) unless the destination has its own.
  if (!destination.includes('?')) {
    const params = new URLSearchParams(request.nextUrl.search);
    params.delete('_rsc');
    target.search = params.toString();
  }
  const response = NextResponse.redirect(target, statusCode as number);
  response.headers.set(
    'Cache-Control',
    PERMANENT_STATUSES.includes(statusCode as number) ? REDIRECT_CACHE_CONTROL : 'no-store',
  );
  return response;
}

// Fails open: on any doubt the request continues as before.
async function publicRoute(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.method !== 'GET' && request.method !== 'HEAD') return NextResponse.next();
  if (request.cookies.has(DRAFT_COOKIE)) return NextResponse.next();
  // Live pages and app-owned paths can never be redirect sources: skip the resolver entirely.
  if (LIVE_PATHS.has(pathname) || isReservedPath(pathname)) return NextResponse.next();
  const hit = await resolve(pathname, request.method === 'GET' && !isPrefetch(request));
  if (hit?.kind === 'redirect') {
    return redirectResponse(request, hit.destination, hit.statusCode) ?? NextResponse.next();
  }
  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = hasSessionCookie(request);

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const adminPath = safeNext(`${pathname}${search}`);
    if (!signedIn) {
      return noindex(redirectTo(`${APP_ROUTES.auth.login}?next=${encodeURIComponent(adminPath)}`, request));
    }
    // Layouts never see the pathname; hand it over in a header. `set` overwrites anything
    // the client sent under the same name.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(ADMIN_PATH_HEADER, adminPath);
    return noindex(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  if (pathname === APP_ROUTES.auth.login) {
    // An already signed-in visitor has nothing to do here. A `next` param means the
    // dashboard just bounced them back (stale cookie, or a customer session with no panel
    // access) — redirecting again would loop, so the form is shown instead.
    if (signedIn && !request.nextUrl.searchParams.has('next')) {
      return noindex(redirectTo(APP_ROUTES.dashboard.index, request));
    }
    return noindex(NextResponse.next());
  }

  return publicRoute(request);
}

// Admin/login, plus every public page path. Assets, the API, share cards and metadata files never
// pay for a proxy invocation. The lookahead is segment-bound, so custom paths like /apiary or
// /og-old still reach the resolver. Must stay a literal: Next parses it at build time.
export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/((?!(?:api|_next|uploads|assets|fonts|og|opengraph-image|twitter-image)(?:/|$)|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$).*)',
  ],
};
