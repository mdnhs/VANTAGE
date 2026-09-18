'use client';

import { useRouter } from 'next/navigation';
import { TestimonialForm } from '../testimonial-form';
import { useCreateTestimonial } from '../../hooks/api/mutation/use-create-testimonial';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreateTestimonialForm() {
  const router = useRouter();
  const createTestimonial = useCreateTestimonial();

  return (
    <TestimonialForm
      submitLabel='Create testimonial'
      isSubmitting={createTestimonial.isPending}
      submitError={createTestimonial.error?.message ?? null}
      onSubmit={async (input) => {
        await createTestimonial.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.testimonials.index),
        });
      }}
    />
  );
}
