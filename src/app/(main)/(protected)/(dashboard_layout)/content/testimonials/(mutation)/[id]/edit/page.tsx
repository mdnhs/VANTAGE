import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { testimonialService } from '@/server/services/testimonial-service';
import { EditTestimonialForm } from '@/features/testimonials/components/edit';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

interface EditTestimonialPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditTestimonialPage({ params }: EditTestimonialPageProps) {
  const { id } = await params;
  const testimonial = await testimonialService.byId(id);
  if (!testimonial) notFound();

  return (
    <PermissionGate
      permissions={[PERMISSIONS.TESTIMONIALS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Edit testimonial</h1>
          <p className='text-sm text-muted-foreground'>{testimonial.customerName}</p>
        </div>
        <EditTestimonialForm testimonial={testimonial} />
      </div>
    </PermissionGate>
  );
}
