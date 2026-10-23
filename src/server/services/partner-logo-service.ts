import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { MEDIA_TAG } from '@/lib/cache/media-tag';
import { mediaIdsOf, prepareMediaWrite, writeWithMedia } from '@/server/lib/media/content-images';
import { partnerLogoRepository } from '@/server/repositories/partner-logo-repository';
import type {
  CreatePartnerLogoInput,
  PartnerLogoListQuery,
  ReorderPartnerLogosInput,
  UpdatePartnerLogoInput,
} from '@/validations/partner-logo-schema';

const MEDIA_PAIRS = [['logoMediaId', 'logoPublicId']] as const;

const LIST_TAG = CACHE_TAGS.all('partner-logos');
const detailTag = (id: string) => CACHE_TAGS.detail('partner-logos', id);

async function listEnabledUncached() {
  return partnerLogoRepository.listEnabled();
}

// Public marketing pages read this — logos change rarely, safe to serve stale between
// explicit revalidations on mutation.
async function listEnabledCached() {
  'use cache';
  cacheTag(MEDIA_TAG);
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
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    const id = await writeWithMedia(mediaIdsOf(input, MEDIA_PAIRS), (tx) => partnerLogoRepository.insert(input, tx));
    const row = await partnerLogoRepository.byId(id);
    // Second arg must match the `cacheLife` profile used in listEnabledCached above.
    revalidateTag(LIST_TAG, 'hours');
    return row;
  },

  async update(id: string, data: UpdatePartnerLogoInput) {
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    const saved = await writeWithMedia(mediaIdsOf(input, MEDIA_PAIRS), (tx) => partnerLogoRepository.patch(id, input, tx));
    const row = saved ? await partnerLogoRepository.byId(id) : undefined;
    revalidateTag(LIST_TAG, 'hours');
    revalidateTag(detailTag(id), 'hours');
    return row;
  },

  async remove(id: string) {
    await partnerLogoRepository.remove(id);
    revalidateTag(LIST_TAG, 'hours');
    revalidateTag(detailTag(id), 'hours');
  },

  async reorder(data: ReorderPartnerLogosInput) {
    await partnerLogoRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'hours');
  },
};
