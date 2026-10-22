import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { MEDIA_TAG } from '@/lib/cache/media-tag';
import { assertMediaExists } from '@/server/lib/media/assert-media';
import { prepareMediaWrite } from '@/server/lib/media/content-images';
import { isAuthorOnly } from '@/lib/auth/content-access';
import type { Actor } from '@/server/lib/auth/actor';
import { assertContentWrite } from '@/server/lib/auth/content-access';
import { projectRepository } from '@/server/repositories/project-repository';
import type {
  CreateProjectInput,
  ProjectListQuery,
  ProjectStatusInput,
  ReorderProjectsInput,
  UpdateProjectInput,
} from '@/validations/project-schema';

const MEDIA_PAIRS = [
  ['beforeImageMediaId', 'beforeImagePublicId'],
  ['afterImageMediaId', 'afterImagePublicId'],
] as const;

const LIST_TAG = CACHE_TAGS.all('projects');
const FEATURED_TAG = CACHE_TAGS.list('projects-featured');
const detailTag = (id: string) => CACHE_TAGS.detail('projects', id);

async function listPublishedUncached() {
  return projectRepository.listPublished();
}

async function listFeaturedUncached() {
  return projectRepository.listFeatured();
}

// Public "Our Work" page reads this. Projects change more often than services/site
// settings (new jobs finished regularly), so this profile is 'minutes' rather than
// services'/settings' 'hours' — fresher without going all the way to per-request.
async function listPublishedCached() {
  'use cache';
  cacheTag(MEDIA_TAG);
  cacheTag(LIST_TAG);
  cacheLife('minutes');
  return listPublishedUncached();
}

async function listFeaturedCached() {
  'use cache';
  cacheTag(MEDIA_TAG);
  cacheTag(FEATURED_TAG);
  cacheLife('minutes');
  return listFeaturedUncached();
}

// Internal callers (seeds, scripts, tests) pass this marker instead of a user: no ownership rules apply.
export const SYSTEM_ACTOR = 'system' as const;
type WriteActor = Actor | typeof SYSTEM_ACTOR;

const authorOnlyActor = (actor: WriteActor): actor is Actor => actor !== SYSTEM_ACTOR && isAuthorOnly(actor.roles);

// Authors write only their own drafts. Returns 'missing' when the row does not exist (the route
// answers 404), or the repository guard that pins the write itself to the author's own draft.
async function guardExisting(
  actor: WriteActor,
  id: string,
  action: 'update' | 'gallery',
  patch?: Record<string, unknown>,
): Promise<'missing' | { ownerId: string } | undefined> {
  if (!authorOnlyActor(actor)) return undefined;
  const row = await projectRepository.byId(id);
  if (!row) return 'missing';
  assertContentWrite(actor, { type: 'project', action, row, patch });
  return { ownerId: actor.userId };
}

export const projectService = {
  listPublished: listPublishedCached,
  listFeatured: listFeaturedCached,

  // Uncached: admin table always shows fresh data, including drafts.
  async listAdmin(params: Pick<ProjectListQuery, 'page' | 'limit'>) {
    return projectRepository.list(params);
  },

  async byId(id: string) {
    return projectRepository.byId(id);
  },

  async bySlug(slug: string) {
    return projectRepository.bySlug(slug);
  },

  async create(data: CreateProjectInput, actor: WriteActor) {
    if (actor !== SYSTEM_ACTOR) assertContentWrite(actor, { type: 'project', action: 'create' });
    const authorOnly = authorOnlyActor(actor);
    const input = await prepareMediaWrite(
      {
        ...data,
        ...(authorOnly ? { status: 'draft' as const, isFeatured: false, displayOrder: undefined } : {}),
        ...(actor !== SYSTEM_ACTOR ? { createdBy: actor.userId } : {}),
      },
      MEDIA_PAIRS,
    );
    await assertMediaExists(input.galleryMediaIds ?? []);
    const row = await projectRepository.create(input);
    // Second arg must match the `cacheLife` profile used in the cached reads above.
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
    return row;
  },

  async update(id: string, data: UpdateProjectInput, actor: WriteActor) {
    const guard = await guardExisting(actor, id, data.galleryMediaIds !== undefined ? 'gallery' : 'update', data);
    if (guard === 'missing') return undefined;
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    await assertMediaExists(input.galleryMediaIds ?? []);
    // A gallery that still has old-storage images is replaced only by the media migration.
    if (input.galleryMediaIds !== undefined && (await projectRepository.legacyGalleryCount(id)) > 0) {
      throw new ApiError(ERROR_CODES.CONFLICT, 'Migrate this gallery first', 409);
    }
    const row = await projectRepository.update(id, input, guard);
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
    revalidateTag(detailTag(id), 'minutes');
    return row;
  },

  async remove(id: string) {
    await projectRepository.remove(id);
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
    revalidateTag(detailTag(id), 'minutes');
  },

  async updateStatus(id: string, data: ProjectStatusInput, actor: WriteActor) {
    if ((await guardExisting(actor, id, 'update', data)) === 'missing') return undefined;
    const row = await projectRepository.updateStatus(id, data.status);
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
    revalidateTag(detailTag(id), 'minutes');
    return row;
  },

  async reorder(data: ReorderProjectsInput, actor: WriteActor) {
    if (authorOnlyActor(actor)) {
      throw ApiError.forbidden('Only an editor can publish, feature or reorder projects.');
    }
    await projectRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
  },
};
