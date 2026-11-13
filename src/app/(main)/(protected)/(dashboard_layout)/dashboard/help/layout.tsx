import type { ReactNode } from 'react';

import { HelpShell } from '@/features/help/components/help-view';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

// Reads the session per request (auth check + the role's articles).
export const instant = false;

// The topics sidebar lives here, not in each page, so moving between articles
// keeps it mounted: open groups, the filter and its scroll stay.
export default async function HelpLayout({ children }: { children: ReactNode }) {
  // Gated by HELP_LINK, as the pages are; the roles pick the topics shown.
  const actor = await requirePermission(permissionFor('/dashboard/help'));
  return <HelpShell roles={actor.roles}>{children}</HelpShell>;
}
