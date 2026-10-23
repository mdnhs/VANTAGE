import 'server-only';

import { ApiError } from '@/server/lib/errors';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { DuplicateUserError, provisionUser } from '@/server/lib/auth/bootstrap';
import type { InviteInput } from '@/validations/user-admin-schema';

const DUPLICATE_MESSAGE = 'Someone with that email already has an account';

// Only an owner may create another owner. Without SMTP the set-password link
// comes back as `manualLink` (never logged, never audited).
export async function inviteUser(actor: Actor, input: InviteInput, headers: Headers) {
  if (input.role === 'owner' && !actor.roles.includes('owner')) {
    throw ApiError.forbidden('Only an owner can invite another owner');
  }

  let result;
  try {
    result = await provisionUser(input, { headers });
  } catch (error) {
    if (error instanceof DuplicateUserError) throw ApiError.conflict(DUPLICATE_MESSAGE);
    throw error;
  }
  const { user, manualLink } = result;
  await audit(actor, {
    action: 'user.invite',
    entityType: 'user',
    entityId: user.id,
    summary: `Invited ${user.email} as ${input.role}`,
  });

  return { id: user.id, email: user.email, name: user.name, role: input.role, ...(manualLink ? { manualLink } : {}) };
}
