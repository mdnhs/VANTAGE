import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { ac, roles } from '@/lib/auth/permissions';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

// Same origin, so cookies flow automatically.
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [adminClient({ ac, roles }), twoFactorClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
