import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { testimonialRepository } from '@/server/repositories/testimonial-repository';
import type {
  CreateTestimonialInput,
  ReorderTestimonialsInput,
  TestimonialListQuery,
  TestimonialStatusInput,
  UpdateTestimonialInput,
} from '@/validations/testimonial-schema';

const LIST_TAG = CACHE_TAGS.all('testimonials');
const FEATURED_TAG = CACHE_TAGS.list('testimonials-featured');

// listPublishedCached only shows published rows, and listFeaturedCached only shows
// published + featured rows — a row that was never published (or never featured) can't be
// in either cached list, so a mutation to it never needs to bust that tag.
type ListedRow = { status: string; isFeatured: boolean } | null | undefined;
const isListed = (row: ListedRow) => row?.status === 'published';
const isFeaturedListed = (row: ListedRow) => isListed(row) && !!row?.isFeatured;

async function listPublishedUncached() {
  return testimonialRepository.listPublished();
}

async function listFeaturedUncached() {
  return testimonialRepository.listFeatured();
}

// Content changes moderately often (new reviews added regularly) — the custom 'content'
// profile (10 min) matches the projects cache profile rather than services'/settings'
// 'hours'. Every mutation below also revalidates on demand, so this window is just the
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
    const row = await testimonialRepository.create(data);
    // A hidden, unfeatured create can't appear in either cached list — nothing to bust.
    // Second arg must match the `cacheLife` profile used in the cached reads above.
    if (isListed(row)) revalidateTag(LIST_TAG, 'content');
    if (isFeaturedListed(row)) revalidateTag(FEATURED_TAG, 'content');
    return row;
  },

  async update(id: string, data: UpdateTestimonialInput) {
    const before = await testimonialRepository.byId(id);
    const row = await testimonialRepository.update(id, data);
    if (!row) return undefined;
    // Bust a list if the row was in it before the edit, is in it after, or both — covers a
    // content edit to an already-listed row and a status/featured change that adds or
    // removes it.
    if (isListed(before) || isListed(row)) revalidateTag(LIST_TAG, 'content');
    if (isFeaturedListed(before) || isFeaturedListed(row)) revalidateTag(FEATURED_TAG, 'content');
    return row;
  },

  async remove(id: string) {
    const before = await testimonialRepository.byId(id);
    await testimonialRepository.remove(id);
    if (isListed(before)) revalidateTag(LIST_TAG, 'content');
    if (isFeaturedListed(before)) revalidateTag(FEATURED_TAG, 'content');
  },

  async updateStatus(id: string, data: TestimonialStatusInput) {
    const row = await testimonialRepository.updateStatus(id, data.status);
    if (!row) return undefined;
    // Status just changed, so LIST_TAG membership necessarily flipped either way. Featured
    // status didn't change here, so only bust FEATURED_TAG if this row is (or was) featured.
    revalidateTag(LIST_TAG, 'content');
    if (row.isFeatured) revalidateTag(FEATURED_TAG, 'content');
    return row;
  },

  async reorder(data: ReorderTestimonialsInput) {
    await testimonialRepository.reorder(data.ids);
    revalidateTag(LIST_TAG, 'content');
    revalidateTag(FEATURED_TAG, 'content');
  },
};
