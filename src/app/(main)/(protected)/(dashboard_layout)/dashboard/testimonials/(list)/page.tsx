import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { testimonialService } from '@/server/services/testimonial-service';
import { TestimonialTable } from '@/features/testimonials/components/list/testimonial-table';

export const metadata: Metadata = {
  title: 'Testimonials',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function TestimonialsListPage() {
  const { rows, total } = await testimonialService.listAdmin({ page: 1, limit: 50 });

  return (
    <PermissionGate
      permissions={[PERMISSIONS.TESTIMONIALS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-semibold'>Testimonials</h1>
            <p className='text-sm text-muted-foreground'>Customer reviews shown on the homepage, in display order.</p>
          </div>
          <Link href={APP_ROUTES.content.testimonials.create} className={cn(buttonVariants())}>
            Add testimonial
          </Link>
        </div>
        <TestimonialTable initialData={{ data: rows, total }} />
      </div>
    </PermissionGate>
  );
}
