import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
import { testimonialService } from '@/server/services/testimonial-service';
import { EditTestimonialForm } from '@/features/testimonials/components/edit';

export const metadata: Metadata = {
  title: 'Edit testimonial',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

interface EditTestimonialPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditTestimonialPage({ params }: EditTestimonialPageProps) {
  await requirePermission(permissionFor('/dashboard/testimonials/[id]/edit'));
  const { id } = await params;
  const testimonial = await testimonialService.byId(id);
  if (!testimonial) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Edit testimonial' description={testimonial.customerName} />
      <EditTestimonialForm testimonial={testimonial} />
    </div>
  );
}
