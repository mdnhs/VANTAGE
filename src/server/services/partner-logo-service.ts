import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { partnerLogoRepository } from '@/server/repositories/partner-logo-repository';
import type {
  CreatePartnerLogoInput,
  PartnerLogoListQuery,
  ReorderPartnerLogosInput,
  UpdatePartnerLogoInput,
} from '@/validations/partner-logo-schema';

const LIST_TAG = CACHE_TAGS.all('partner-logos');

async function listEnabledUncached() {
  return partnerLogoRepository.listEnabled();
}

// Public marketing pages read this — logos change rarely, safe to serve stale between
// explicit revalidations on mutation.
async function listEnabledCached() {
  'use cache';
  cacheTag(LIST_TAG);
  cacheLife('hours');
  return listEnabledUncached();
}

export const partnerLogoService = {
  listEnabled: listEnabledCached,

  // Uncached: admin table always shows fresh data, including disabled rows.
  async listAdmin(params: Pick<PartnerLogoListQuery, 'page' | 'limit'>) {
    return partnerLogoRepository.list(params);
  },

  async byId(id: string) {
    return partnerLogoRepository.byId(id);
  },

  async create(data: CreatePartnerLogoInput) {
    const row = await partnerLogoRepository.create(data);
    // Second arg must match the `cacheLife` profile used in listEnabledCached above.
    revalidateTag(LIST_TAG, 'hours');
    return row;
  },

  async update(id: string, data: UpdatePartnerLogoInput) {
    const row = await partnerLogoRepository.update(id, data);
    revalidateTag(LIST_TAG, 'hours');
    return row;
  },

  async remove(id: string) {
    await partnerLogoRepository.remove(id);
    revalidateTag(LIST_TAG, 'hours');
  },

  async reorder(data: ReorderPartnerLogosInput) {
    await partnerLogoRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'hours');
  },
};
