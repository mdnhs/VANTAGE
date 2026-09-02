// Next.js 16 (replaced middleware.ts). Cookie reads and redirects only — never a database call.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// TODO: add cookie/session redirect logic here as auth is implemented.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

// Exclude everything static: each excluded path is an invocation not billed.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|assets|images|fonts|api/health).*)',
  ],
};
