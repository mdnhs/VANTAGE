'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { queryClient } from '@/contexts/QueryProvider';
import { authClient } from '@/lib/auth-client';
import { APP_ROUTES } from '@/lib/routes/app-routes';

type SignOutDeps = {
  signOut: () => Promise<{ error?: unknown } | undefined | void>;
  clearCache: () => void;
  leave: () => void;
};

// Ends the session, then drops everything of this user from the tab. Resolves false (and
// touches nothing) when sign-out failed, so the screen the session had stays as it was.
export async function runSignOut({ signOut, clearCache, leave }: SignOutDeps): Promise<boolean> {
  let failed = false;
  try {
    failed = Boolean((await signOut())?.error);
  } catch {
    failed = true;
  }
  if (failed) return false;
  clearCache();
  leave();
  return true;
}

// The one sign-out path: every "Log out" control calls this.
export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    setPending(true);
    setError(null);
    const done = await runSignOut({
      signOut: () => authClient.signOut(),
      clearCache: () => queryClient.clear(),
      leave: () => {
        router.push(APP_ROUTES.auth.login);
        router.refresh();
      },
    });
    // On success the sign-in page replaces this screen, so it stays pending.
    if (!done) {
      setPending(false);
      setError("Couldn't sign out. Try again.");
    }
  }, [router]);

  return { signOut, pending, error };
}
