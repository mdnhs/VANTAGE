// Next.js 16 (replaced middleware.ts). Cookie reads and redirects only — never a database call.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_PATH_HEADER } from '@/lib/auth/admin-path';
import { safeNext } from '@/lib/auth/safe-next';
import { APP_ROUTES } from '@/lib/routes/app-routes';

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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = hasSessionCookie(request);

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const adminPath = safeNext(`${pathname}${search}`);
    if (!signedIn) {
      return redirectTo(`${APP_ROUTES.auth.login}?next=${encodeURIComponent(adminPath)}`, request);
    }
    // Layouts never see the pathname; hand it over in a header. `set` overwrites anything
    // the client sent under the same name.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(ADMIN_PATH_HEADER, adminPath);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Login: an already signed-in visitor has nothing to do here. A `next` param means the
  // dashboard just bounced them back (stale cookie, or a customer session with no panel
  // access) — redirecting again would loop, so the form is shown instead.
  if (pathname === APP_ROUTES.auth.login && signedIn && !request.nextUrl.searchParams.has('next')) {
    return redirectTo(APP_ROUTES.dashboard.index, request);
  }

  return NextResponse.next();
}

// Only the routes this proxy actually acts on — every other request (marketing pages, API,
// static files) skips it entirely, which also keeps invocations to a minimum.
export const config = {
  matcher: ['/login', '/dashboard/:path*'],
};
