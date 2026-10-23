import { NextResponse, type NextRequest } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/server/lib/auth';

const handlers = () => toNextJsHandler(getAuth());

// Accounts are provisioned by an admin (auth.api.createUser), not self-service —
// block the public sign-up endpoint while leaving sign-in/session/sign-out intact.
function blockSignUp(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith('/sign-up/email')) {
    return NextResponse.json({ error: 'Sign-up is disabled' }, { status: 404 });
  }
  return null;
}

export const GET = (request: NextRequest) => handlers().GET(request);

export function POST(request: NextRequest) {
  return blockSignUp(request) ?? handlers().POST(request);
}
