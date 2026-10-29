import { AUTHOR_LOCKED_PROJECT_FIELDS, isAuthorOnly } from '@/lib/auth/content-access';
import type { Actor } from '@/server/lib/auth/actor';
import { ApiError } from '@/server/lib/errors';

export type ContentTarget =
  | { type: 'project'; action: 'create' }
  | {
      type: 'project';
      action: 'update' | 'reorder' | 'gallery';
      row: { createdBy: string | null; status: string };
      patch?: Record<string, unknown>;
    }
  | {
      type: 'service' | 'testimonial' | 'partner-logo' | 'pillar' | 'catalog' | 'process-step' | 'legal-page';
      action: 'create' | 'update' | 'reorder';
    };

const OWN_DRAFTS = 'Authors can only add and edit their own draft projects.';
const EDITOR_ONLY = 'Only an editor can publish, feature or reorder projects.';

// Authors create drafts and edit their own drafts; everything else in content is
// refused. Roles other than author-only pass untouched.
export function assertContentWrite(actor: Actor, target: ContentTarget): void {
  if (!isAuthorOnly(actor.roles)) return;
  if (target.type !== 'project') throw ApiError.forbidden(OWN_DRAFTS);
  if (target.action === 'create') return;
  if (target.action === 'reorder') throw ApiError.forbidden(EDITOR_ONLY);
  if (target.row.createdBy !== actor.userId || target.row.status !== 'draft') {
    throw ApiError.forbidden(OWN_DRAFTS);
  }
  if (target.patch && AUTHOR_LOCKED_PROJECT_FIELDS.some((field) => field in target.patch!)) {
    throw ApiError.forbidden(EDITOR_ONLY);
  }
}
