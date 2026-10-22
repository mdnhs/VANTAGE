import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { ac, roles } from '@/lib/auth/permissions';

// Same origin, so cookies flow automatically.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  plugins: [adminClient({ ac, roles }), twoFactorClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
