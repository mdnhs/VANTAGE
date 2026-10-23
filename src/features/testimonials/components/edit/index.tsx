'use client';

import { AuthorReadOnlyNotice, useAuthorOnly } from '@/components/admin/author-gate';
import { useRouter } from 'next/navigation';
import { TestimonialForm } from '../testimonial-form';
import { useUpdateTestimonial } from '../../hooks/api/mutation/use-update-testimonial';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { Testimonial } from '../../types';

interface EditTestimonialFormProps {
  testimonial: Testimonial;
}

export function EditTestimonialForm({ testimonial }: EditTestimonialFormProps) {
  const router = useRouter();
  const authorOnly = useAuthorOnly();
  const updateTestimonial = useUpdateTestimonial(testimonial.id);

  if (authorOnly) return <AuthorReadOnlyNotice backHref={APP_ROUTES.content.testimonials.index} />;

  return (
    <TestimonialForm
      initialData={testimonial}
      submitLabel='Save changes'
      isSubmitting={updateTestimonial.isPending}
      submitError={updateTestimonial.error?.message ?? null}
      onSubmit={async (input) => {
        await updateTestimonial.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.testimonials.index),
        });
      }}
    />
  );
}
