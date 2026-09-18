// Next.js 16 (replaced middleware.ts). Cookie reads and redirects only — never a database call.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/server/lib/session';
import { APP_ROUTES } from '@/lib/routes/app-routes';

// Presence-only check — cheap and DB-free. The real JWT verification + permission check
// happens in (dashboard_layout)/layout.tsx, which can redirect on an expired/invalid token
// too. This just keeps unauthenticated users from ever rendering a dashboard shell.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    const hasSession = request.cookies.has(SESSION_COOKIE);
    if (!hasSession) {
      const loginUrl = new URL(APP_ROUTES.auth.login, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Exclude everything static: each excluded path is an invocation not billed.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|assets|images|fonts|api/health).*)',
  ],
};
