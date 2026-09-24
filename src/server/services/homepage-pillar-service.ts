import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { homepagePillarRepository } from '@/server/repositories/homepage-pillar-repository';
import type {
  CreateHomepagePillarInput,
  HomepagePillarListQuery,
  ReorderHomepagePillarsInput,
  UpdateHomepagePillarInput,
} from '@/validations/homepage-pillar-schema';

const LIST_TAG = CACHE_TAGS.all('homepage-pillars');

async function listEnabledUncached() {
  return homepagePillarRepository.listEnabled();
}

// Public marketing pages read this — pillars change rarely, safe to serve stale between
// explicit revalidations on mutation.
async function listEnabledCached() {
  'use cache';
  cacheTag(LIST_TAG);
  cacheLife('days');
  return listEnabledUncached();
}

export const homepagePillarService = {
  listEnabled: listEnabledCached,

  // Uncached: admin table always shows fresh data, including disabled rows.
  async listAdmin(params: Pick<HomepagePillarListQuery, 'page' | 'limit'>) {
    return homepagePillarRepository.list(params);
  },

  async byId(id: string) {
    return homepagePillarRepository.byId(id);
  },

  async create(data: CreateHomepagePillarInput) {
    const row = await homepagePillarRepository.create(data);
    // Second arg must match the `cacheLife` profile used in listEnabledCached above.
    revalidateTag(LIST_TAG, 'days');
    return row;
  },

  async update(id: string, data: UpdateHomepagePillarInput) {
    const row = await homepagePillarRepository.update(id, data);
    revalidateTag(LIST_TAG, 'days');
    return row;
  },

  async remove(id: string) {
    await homepagePillarRepository.remove(id);
    revalidateTag(LIST_TAG, 'days');
  },

  async reorder(data: ReorderHomepagePillarsInput) {
    await homepagePillarRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'days');
  },
};
