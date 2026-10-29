import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { homepageCatalogService } from '@/server/services/homepage-catalog-service';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { testimonialService } from '@/server/services/testimonial-service';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import { HomePageTabs } from '@/features/home-page/components/home-page-tabs';

export const metadata: Metadata = {
  title: 'Home page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function HomePageContentPage() {
  await requirePermission(permissionFor('/dashboard/home-page'));
  const [catalogItems, processSteps, testimonials, partnerLogos] = await Promise.all([
    homepageCatalogService.listAdmin({ page: 1, limit: 50 }),
    homepageProcessStepService.listAdmin({ page: 1, limit: 50 }),
    testimonialService.listAdmin({ page: 1, limit: 50 }),
    partnerLogoService.listAdmin({ page: 1, limit: 50 }),
  ]);

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Home page'
        description='Everything on the homepage, top to bottom: banner text and media (edits show in a live preview and go live when you publish), service cards, process steps, reviews and partner logos.'
      />
      <HomePageTabs
        catalogItems={{ data: catalogItems.rows, total: catalogItems.total }}
        processSteps={{ data: processSteps.rows, total: processSteps.total }}
        testimonials={{ data: testimonials.rows, total: testimonials.total }}
        partnerLogos={{ data: partnerLogos.rows, total: partnerLogos.total }}
      />
    </div>
  );
}
