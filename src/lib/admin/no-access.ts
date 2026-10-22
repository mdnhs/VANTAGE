import { safeNext } from '@/lib/auth/safe-next';

import { linkForPath } from './nav';

export const NO_ACCESS_PATH = '/dashboard/no-access';

// Where a signed-in role lands when it may not open `from` (an admin path).
export function noAccessHref(from: string | null | undefined): string {
  return `${NO_ACCESS_PATH}?from=${encodeURIComponent(safeNext(from))}`;
}

// The registry label of the page that was refused, if it is one.
export function noAccessLabel(from: string | null | undefined): string | undefined {
  const target = safeNext(from, '');
  return target ? linkForPath(target)?.label : undefined;
}
