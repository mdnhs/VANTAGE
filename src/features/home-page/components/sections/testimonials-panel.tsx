import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { TestimonialTable } from '@/features/testimonials/components/list/testimonial-table';
import type { Testimonial } from '@/features/testimonials/types';

export function TestimonialsPanel({ initialData }: { initialData: { data: Testimonial[]; total: number } }) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>Customer reviews shown on the homepage, in display order.</p>
        <Link href={APP_ROUTES.content.testimonials.create} className={cn(buttonVariants())}>
          Add testimonial
        </Link>
      </div>
      <TestimonialTable initialData={initialData} />
    </div>
  );
}
