import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { homepageProcessStepRepository } from '@/server/repositories/homepage-process-step-repository';
import type {
  CreateHomepageProcessStepInput,
  HomepageProcessStepListQuery,
  ReorderHomepageProcessStepsInput,
  UpdateHomepageProcessStepInput,
} from '@/validations/homepage-process-step-schema';

const LIST_TAG = CACHE_TAGS.all('homepage-process-steps');
const detailTag = (id: string) => CACHE_TAGS.detail('homepage-process-steps', id);

async function listEnabledUncached() {
  return homepageProcessStepRepository.listEnabled();
}

// Public marketing pages read this — steps change rarely, safe to serve stale between
// explicit revalidations on mutation.
async function listEnabledCached() {
  'use cache';
  cacheTag(LIST_TAG);
  cacheLife('hours');
  return listEnabledUncached();
}

export const homepageProcessStepService = {
  listEnabled: listEnabledCached,

  // Uncached: admin table always shows fresh data, including disabled rows.
  async listAdmin(params: Pick<HomepageProcessStepListQuery, 'page' | 'limit'>) {
    return homepageProcessStepRepository.list(params);
  },

  async byId(id: string) {
    return homepageProcessStepRepository.byId(id);
  },

  async create(data: CreateHomepageProcessStepInput) {
    const row = await homepageProcessStepRepository.create(data);
    // Second arg must match the `cacheLife` profile used in listEnabledCached above.
    revalidateTag(LIST_TAG, 'hours');
    return row;
  },

  async update(id: string, data: UpdateHomepageProcessStepInput) {
    const row = await homepageProcessStepRepository.update(id, data);
    revalidateTag(LIST_TAG, 'hours');
    revalidateTag(detailTag(id), 'hours');
    return row;
  },

  async remove(id: string) {
    await homepageProcessStepRepository.remove(id);
    revalidateTag(LIST_TAG, 'hours');
    revalidateTag(detailTag(id), 'hours');
  },

  async reorder(data: ReorderHomepageProcessStepsInput) {
    await homepageProcessStepRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'hours');
  },
};
