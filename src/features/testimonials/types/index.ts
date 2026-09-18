import type { Testimonial } from '@/server/db/schema';
import type {
  CreateTestimonialInput,
  ReorderTestimonialsInput,
  TestimonialStatusInput,
  UpdateTestimonialInput,
} from '@/validations/testimonial-schema';

export type {
  Testimonial,
  CreateTestimonialInput,
  UpdateTestimonialInput,
  ReorderTestimonialsInput,
  TestimonialStatusInput,
};

// Shape returned by the public `/testimonials` and `/testimonials/featured` routes.
export type TestimonialPublic = Testimonial;

export interface TestimonialListFilters {
  page: number;
  limit: number;
}

export const TESTIMONIAL_STATUS_VALUES = ['published', 'hidden'] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUS_VALUES)[number];

// The wire payload sent from the browser: JSON has no Date type, so `receivedAt` travels as
// a plain 'YYYY-MM-DD' string (or null) — the Hono route's `z.coerce.date()` on
// createTestimonialSchema/updateTestimonialSchema turns it back into a Date server-side.
export type TestimonialCreatePayload = Omit<CreateTestimonialInput, 'receivedAt'> & { receivedAt?: string | null };
export type TestimonialUpdatePayload = Omit<UpdateTestimonialInput, 'receivedAt'> & { receivedAt?: string | null };
