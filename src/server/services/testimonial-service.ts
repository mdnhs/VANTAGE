import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { MEDIA_TAG } from '@/lib/cache/media-tag';
import { mediaIdsOf, prepareMediaWrite, writeWithMedia } from '@/server/lib/media/content-images';
import { testimonialRepository } from '@/server/repositories/testimonial-repository';
import type {
  CreateTestimonialInput,
  ReorderTestimonialsInput,
  TestimonialListQuery,
  TestimonialStatusInput,
  UpdateTestimonialInput,
} from '@/validations/testimonial-schema';

const MEDIA_PAIRS = [['avatarMediaId', 'avatarPublicId']] as const;

const LIST_TAG = CACHE_TAGS.all('testimonials');
const FEATURED_TAG = CACHE_TAGS.list('testimonials-featured');
const detailTag = (id: string) => CACHE_TAGS.detail('testimonials', id);

async function listPublishedUncached() {
  return testimonialRepository.listPublished();
}

async function listFeaturedUncached() {
  return testimonialRepository.listFeatured();
}

// Content changes moderately often (new reviews added regularly) — 'minutes' matches the
// projects cache profile rather than services'/settings' 'hours'.
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

export const testimonialService = {
  listPublished: listPublishedCached,
  listFeatured: listFeaturedCached,

  // Uncached: admin table always shows fresh data, including hidden rows.
  async listAdmin(params: Pick<TestimonialListQuery, 'page' | 'limit'>) {
    return testimonialRepository.list(params);
  },

  async byId(id: string) {
    return testimonialRepository.byId(id);
  },

  async create(data: CreateTestimonialInput) {
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    const id = await writeWithMedia(mediaIdsOf(input, MEDIA_PAIRS), (tx) => testimonialRepository.insert(input, tx));
    const row = await testimonialRepository.byId(id);
    // Second arg must match the `cacheLife` profile used in the cached reads above.
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
    return row;
  },

  async update(id: string, data: UpdateTestimonialInput) {
    const input = await prepareMediaWrite(data, MEDIA_PAIRS);
    const saved = await writeWithMedia(mediaIdsOf(input, MEDIA_PAIRS), (tx) => testimonialRepository.patch(id, input, tx));
    const row = saved ? await testimonialRepository.byId(id) : undefined;
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
    revalidateTag(detailTag(id), 'minutes');
    return row;
  },

  async remove(id: string) {
    await testimonialRepository.remove(id);
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
    revalidateTag(detailTag(id), 'minutes');
  },

  async updateStatus(id: string, data: TestimonialStatusInput) {
    const row = await testimonialRepository.updateStatus(id, data.status);
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
    revalidateTag(detailTag(id), 'minutes');
    return row;
  },

  async reorder(data: ReorderTestimonialsInput) {
    await testimonialRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'minutes');
    revalidateTag(FEATURED_TAG, 'minutes');
  },
};
