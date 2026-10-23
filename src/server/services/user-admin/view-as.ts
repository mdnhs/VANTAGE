import 'server-only';

import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import type { Actor } from '@/server/lib/auth/actor';
import { getAuth } from '@/server/lib/auth';
import { isBanned } from '@/server/lib/auth/fresh-session';
import { viewAsRefusal } from '@/server/lib/auth/view-as-limit';

import { loadTarget, NO_ACCOUNT } from './manage';

// Our guard first (owners, self, banned), then Better Auth's own impersonate /
// impersonate-admins check, then its cookies go back to the browser. The start
// is audited by databaseHooks.session.create (auth.ts).
export async function startViewAs(actor: Actor, id: string, headers: Headers) {
  const target = await loadTarget(id);
  if (target.roles.length === 0) throw ApiError.notFound(NO_ACCOUNT);
  const why = viewAsRefusal(actor, target);
  if (why) throw ApiError.forbidden(why);
  if (isBanned(target)) throw ApiError.conflict('Unban them before viewing as them');
  const response = await getAuth().api.impersonateUser({
    body: { userId: id },
    headers,
    asResponse: true,
  });
  if (response.status === 401 || response.status === 403) throw ApiError.forbidden("You can't view as this person");
  if (!response.ok) throw new ApiError(ERROR_CODES.VALIDATION_ERROR, "View as couldn't start", 400);
  return response.headers.getSetCookie();
}
