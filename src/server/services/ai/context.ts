import 'server-only';

import type { ChatContext, PageKey } from '@/lib/ai/schema';
import { hasPermission } from '@/lib/auth/permissions';
import { GLOBAL_LABELS } from '@/lib/content/global-access';
import type { Actor } from '@/server/lib/auth/actor';
import { readEffectiveGlobal } from '@/server/services/globals-service';

import { errorTag } from './errors';

export type ContextSubject = { kind: 'page'; key: PageKey; title: string };

// The screen the person is on, as one subject the model may look up: the title
// only, and only for someone who may read pages. Any failure leaves it out.
export async function contextSubject(actor: Actor, context?: ChatContext): Promise<ContextSubject | null> {
  const entity = context?.entity;
  if (!entity) return null;
  if (!hasPermission(actor.roles, { page: ['read'] })) return null;
  try {
    await readEffectiveGlobal(entity.key);
    return { kind: 'page', key: entity.key, title: GLOBAL_LABELS[entity.key] };
  } catch (error) {
    console.error('[ai] could not read the chat context', errorTag(error));
    return null;
  }
}
