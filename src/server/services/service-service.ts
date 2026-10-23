import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { MEDIA_TAG } from '@/lib/cache/media-tag';
import { mediaIdsOf, prepareMediaWrite, writeWithMedia } from '@/server/lib/media/content-images';
import { serviceRepository } from '@/server/repositories/service-repository';
import type {
  CreateServiceInput,
  ReorderServicesInput,
  ServiceListQuery,
  UpdateServiceInput,
} from '@/validations/service-schema';

const MEDIA_PAIRS = [
  ['iconMediaId', 'iconPublicId'],
  ['imageMediaId', 'imagePublicId'],
] as const;

const LIST_TAG = CACHE_TAGS.all('services');
const detailTag = (id: string) => CACHE_TAGS.detail('services', id);

async function listPublishedUncached() {
  return serviceRepository.listPublished();
}

// Public marketing pages read this — services change rarely, safe to serve stale between
// explicit revalidations on mutation.
async function listPublishedCached() {
  'use cache';
  cacheTag(MEDIA_TAG);
  cacheTag(LIST_TAG);
  cacheLife('hours');
  return listPublishedUncached();
}

export const serviceService = {
  listPublished: listPublishedCached,

  // Uncached: admin table always shows fresh data, including disabled rows.
  async listAdmin(params: Pick<ServiceListQuery, 'page' | 'limit'>) {
    return serviceRepository.list(params);
  },

  async byId(id: string) {
    return serviceRepository.byId(id);
  },

  async create(data: CreateServiceInput) {
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    const id = await writeWithMedia(mediaIdsOf(input, MEDIA_PAIRS), (tx) => serviceRepository.insert(input, tx));
    const row = await serviceRepository.byId(id);
    // Second arg must match the `cacheLife` profile used in listPublishedCached above.
    revalidateTag(LIST_TAG, 'hours');
    return row;
  },

  async update(id: string, data: UpdateServiceInput) {
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    const saved = await writeWithMedia(mediaIdsOf(input, MEDIA_PAIRS), (tx) => serviceRepository.patch(id, input, tx));
    const row = saved ? await serviceRepository.byId(id) : undefined;
    revalidateTag(LIST_TAG, 'hours');
    revalidateTag(detailTag(id), 'hours');
    return row;
  },

  async remove(id: string) {
    await serviceRepository.remove(id);
    revalidateTag(LIST_TAG, 'hours');
    revalidateTag(detailTag(id), 'hours');
  },

  async reorder(data: ReorderServicesInput) {
    await serviceRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'hours');
  },
};
