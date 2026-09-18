import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { homepageCatalogRepository } from '@/server/repositories/homepage-catalog-repository';
import type {
  CreateHomepageCatalogInput,
  HomepageCatalogListQuery,
  ReorderHomepageCatalogsInput,
  UpdateHomepageCatalogInput,
} from '@/validations/homepage-catalog-schema';

const LIST_TAG = CACHE_TAGS.all('homepage-catalogs');
const detailTag = (id: string) => CACHE_TAGS.detail('homepage-catalogs', id);

async function listEnabledUncached() {
  return homepageCatalogRepository.listEnabled();
}

async function listEnabledCached() {
  'use cache';
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
    const row = await homepageCatalogRepository.create(data);
    revalidateTag(LIST_TAG, 'hours');
    return row;
  },

  async update(id: string, data: UpdateHomepageCatalogInput) {
    const row = await homepageCatalogRepository.update(id, data);
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
