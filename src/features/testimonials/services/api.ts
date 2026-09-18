import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  ReorderTestimonialsInput,
  Testimonial,
  TestimonialCreatePayload,
  TestimonialListFilters,
  TestimonialPublic,
  TestimonialStatusInput,
  TestimonialUpdatePayload,
} from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Request failed');
  }
  return body.data as T;
}

async function parseWithPagination<T>(res: Response): Promise<{ data: T; pagination?: PaginationMeta }> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Request failed');
  }
  return { data: body.data as T, pagination: body.pagination };
}

export async function fetchPublicTestimonials(): Promise<TestimonialPublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.public}`);
  return parseOrThrow<TestimonialPublic[]>(res);
}

export async function fetchFeaturedTestimonials(): Promise<TestimonialPublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.featured}`);
  return parseOrThrow<TestimonialPublic[]>(res);
}

export async function fetchAdminTestimonialList(
  filters: TestimonialListFilters,
): Promise<{ data: Testimonial[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<Testimonial[]>(res);
}

export async function fetchTestimonialDetail(id: string): Promise<Testimonial> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<Testimonial>(res);
}

export async function createTestimonial(input: TestimonialCreatePayload): Promise<Testimonial> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.create}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Testimonial>(res);
}

export async function updateTestimonial(id: string, input: TestimonialUpdatePayload): Promise<Testimonial> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Testimonial>(res);
}

export async function deleteTestimonial(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}

export async function updateTestimonialStatus(id: string, input: TestimonialStatusInput): Promise<Testimonial> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.updateStatus(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Testimonial>(res);
}

export async function reorderTestimonials(input: ReorderTestimonialsInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.testimonials.reorder}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ success: true }>(res);
}
