import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { MEDIA_TAG } from '@/lib/cache/media-tag';
import { mediaIdsOf, prepareMediaWrite, writeWithMedia } from '@/server/lib/media/content-images';
import { homepageCatalogRepository } from '@/server/repositories/homepage-catalog-repository';
import type {
  CreateHomepageCatalogInput,
  HomepageCatalogListQuery,
  ReorderHomepageCatalogsInput,
  UpdateHomepageCatalogInput,
} from '@/validations/homepage-catalog-schema';

const MEDIA_PAIRS = [['iconMediaId', 'iconPublicId']] as const;

const LIST_TAG = CACHE_TAGS.all('homepage-catalogs');
const detailTag = (id: string) => CACHE_TAGS.detail('homepage-catalogs', id);

async function listEnabledUncached() {
  return homepageCatalogRepository.listEnabled();
}

async function listEnabledCached() {
  'use cache';
  cacheTag(MEDIA_TAG);
  cacheTag(LIST_TAG);
  cacheLife('hours');
  return listEnabledUncached();
}

export const homepageCatalogService = {
  listEnabled: listEnabledCached,

  async listAdmin(params: Pick<HomepageCatalogListQuery, 'page' | 'limit'>) {
    return homepageCatalogRepository.list(params);
  },

  async byId(id: string) {
    return homepageCatalogRepository.byId(id);
  },

  async create(data: CreateHomepageCatalogInput) {
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    const id = await writeWithMedia(mediaIdsOf(input, MEDIA_PAIRS), (tx) => homepageCatalogRepository.insert(input, tx));
    const row = await homepageCatalogRepository.byId(id);
    revalidateTag(LIST_TAG, 'hours');
    return row;
  },

  async update(id: string, data: UpdateHomepageCatalogInput) {
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    const saved = await writeWithMedia(mediaIdsOf(input, MEDIA_PAIRS), (tx) => homepageCatalogRepository.patch(id, input, tx));
    const row = saved ? await homepageCatalogRepository.byId(id) : undefined;
    revalidateTag(LIST_TAG, 'hours');
    revalidateTag(detailTag(id), 'hours');
    return row;
  },

  async remove(id: string) {
    await homepageCatalogRepository.remove(id);
    revalidateTag(LIST_TAG, 'hours');
    revalidateTag(detailTag(id), 'hours');
  },

  async reorder(data: ReorderHomepageCatalogsInput) {
    await homepageCatalogRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'hours');
  },
};
