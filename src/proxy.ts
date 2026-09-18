// Next.js 16 (replaced middleware.ts). Cookie reads and redirects only — never a database call.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/server/lib/session';
import { APP_ROUTES } from '@/lib/routes/app-routes';

const redirectTo = (path: string, request: NextRequest) => {
  const response = NextResponse.redirect(new URL(path, request.url));
  // Auth-dependent redirect — must never be cached by the browser or a CDN.
  response.headers.set('Cache-Control', 'no-store');
  return response;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Dashboard: presence-only check — cheap and DB-free. The real JWT verification + permission
  // check happens in (dashboard_layout)/layout.tsx, which redirects on an expired/invalid token.
  if (pathname.startsWith('/dashboard')) {
    return token ? NextResponse.next() : redirectTo(APP_ROUTES.auth.login, request);
  }

  // Login: an already signed-in admin has nothing to do here — send them to the dashboard.
  // Unlike the dashboard check this verifies the token signature/expiry, otherwise a stale
  // cookie would bounce login → dashboard → login forever.
  if (pathname === APP_ROUTES.auth.login && token) {
    if (await verifySessionToken(token)) return redirectTo(APP_ROUTES.dashboard.index, request);

    // Expired or tampered cookie: drop it so the form starts clean.
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

// Only the routes this proxy actually acts on — every other request (marketing pages, API,
// static files) skips it entirely, which also keeps invocations to a minimum.
export const config = {
  matcher: ['/login', '/dashboard/:path*'],
};
