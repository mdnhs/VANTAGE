import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { projectRepository } from '@/server/repositories/project-repository';
import type {
  CreateProjectInput,
  ProjectListQuery,
  ProjectStatusInput,
  ReorderProjectsInput,
  UpdateProjectInput,
} from '@/validations/project-schema';

const LIST_TAG = CACHE_TAGS.all('projects');
const FEATURED_TAG = CACHE_TAGS.list('projects-featured');

// listPublishedCached only shows published rows, and listFeaturedCached only shows
// published + featured rows — a row that was never published (or never featured) can't be
// in either cached list, so a mutation to it never needs to bust that tag.
type ListedRow = { status: string; isFeatured: boolean } | null | undefined;
const isListed = (row: ListedRow) => row?.status === 'published';
const isFeaturedListed = (row: ListedRow) => isListed(row) && !!row?.isFeatured;

async function listPublishedUncached() {
  return projectRepository.listPublished();
}

async function listFeaturedUncached() {
  return projectRepository.listFeatured();
}

// Public "Our Work" page reads this. Projects change more often than services/site
// settings (new jobs finished regularly), so this profile is the custom 'content' profile
// (10 min) rather than services'/settings' 'hours' — fresher without going all the way to
// per-request. Every mutation below also revalidates on demand, so this window is just the
// backstop between edits, not the only freshness guarantee.
async function listPublishedCached() {
  'use cache';
  cacheTag(LIST_TAG);
  cacheLife('content');
  return listPublishedUncached();
}

async function listFeaturedCached() {
  'use cache';
  cacheTag(FEATURED_TAG);
  cacheLife('content');
  return listFeaturedUncached();
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

  async create(data: CreateProjectInput) {
    const row = await projectRepository.create(data);
    // A draft, unfeatured create can't appear in either cached list — nothing to bust.
    // Second arg must match the `cacheLife` profile used in the cached reads above.
    if (isListed(row)) revalidateTag(LIST_TAG, 'content');
    if (isFeaturedListed(row)) revalidateTag(FEATURED_TAG, 'content');
    return row;
  },

  async update(id: string, data: UpdateProjectInput) {
    const before = await projectRepository.byId(id);
    const row = await projectRepository.update(id, data);
    if (!row) return undefined;
    // Bust a list if the row was in it before the edit, is in it after, or both — covers a
    // content edit to an already-listed row and a status/featured change that adds or
    // removes it.
    if (isListed(before) || isListed(row)) revalidateTag(LIST_TAG, 'content');
    if (isFeaturedListed(before) || isFeaturedListed(row)) revalidateTag(FEATURED_TAG, 'content');
    return row;
  },

  async remove(id: string) {
    const before = await projectRepository.byId(id);
    await projectRepository.remove(id);
    if (isListed(before)) revalidateTag(LIST_TAG, 'content');
    if (isFeaturedListed(before)) revalidateTag(FEATURED_TAG, 'content');
  },

  async updateStatus(id: string, data: ProjectStatusInput) {
    const row = await projectRepository.updateStatus(id, data.status);
    if (!row) return undefined;
    // Status just changed, so LIST_TAG membership necessarily flipped either way. Featured
    // status didn't change here, so only bust FEATURED_TAG if this row is (or was) featured.
    revalidateTag(LIST_TAG, 'content');
    if (row.isFeatured) revalidateTag(FEATURED_TAG, 'content');
    return row;
  },

  async reorder(data: ReorderProjectsInput) {
    await projectRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'content');
    revalidateTag(FEATURED_TAG, 'content');
  },
};
