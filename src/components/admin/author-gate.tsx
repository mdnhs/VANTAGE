'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useActor } from '@/contexts/actor-provider';
import { isAuthorOnly } from '@/lib/auth/content-access';

// UI gating only — the API enforces the same rule.
export function useAuthorOnly(): boolean {
  return isAuthorOnly(useActor().roles);
}

// Hides controls an author-only user cannot use (create, reorder, enable).
export function HideForAuthorOnly({ children }: { children: ReactNode }) {
  return useAuthorOnly() ? null : <>{children}</>;
}

// Shown instead of an edit form the author-only user may not use.
export function AuthorReadOnlyNotice({ backHref }: { backHref: string }) {
  return (
    <div className='flex flex-col items-start gap-3 rounded-lg border border-border p-4 text-sm'>
      <p className='text-muted-foreground'>
        This item is read-only for you. Authors can only edit their own draft projects.
      </p>
      <Link href={backHref} className='font-medium underline'>
        Back to the list
      </Link>
    </div>
  );
}
