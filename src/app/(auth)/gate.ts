import 'server-only';

import { parseRoles } from '@/lib/auth/permissions';
import { getSession } from '@/server/lib/auth/session';

// True when the visitor already holds a session that can use the panel. Site customers
// (role "user") have valid sessions but no panel access: sending them to `next` would
// bounce straight back here, so they get the form instead.
export async function hasPanelSession(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session && parseRoles(session.user.role).length > 0);
}
