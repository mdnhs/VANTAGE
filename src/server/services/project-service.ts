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
const detailTag = (id: string) => CACHE_TAGS.detail('projects', id);

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
    // Second arg must match the `cacheLife` profile used in the cached reads above.
    revalidateTag(LIST_TAG, 'content');
    revalidateTag(FEATURED_TAG, 'content');
    return row;
  },

  async update(id: string, data: UpdateProjectInput) {
    const row = await projectRepository.update(id, data);
    revalidateTag(LIST_TAG, 'content');
    revalidateTag(FEATURED_TAG, 'content');
    revalidateTag(detailTag(id), 'content');
    return row;
  },

  async remove(id: string) {
    await projectRepository.remove(id);
    revalidateTag(LIST_TAG, 'content');
    revalidateTag(FEATURED_TAG, 'content');
    revalidateTag(detailTag(id), 'content');
  },

  async updateStatus(id: string, data: ProjectStatusInput) {
    const row = await projectRepository.updateStatus(id, data.status);
    revalidateTag(LIST_TAG, 'content');
    revalidateTag(FEATURED_TAG, 'content');
    revalidateTag(detailTag(id), 'content');
    return row;
  },

  async reorder(data: ReorderProjectsInput) {
    await projectRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'content');
    revalidateTag(FEATURED_TAG, 'content');
  },
};
