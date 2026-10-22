import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { homepagePillarService } from '@/server/services/homepage-pillar-service';
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
  const [settings, pillars, catalogItems, processSteps, testimonials, partnerLogos] = await Promise.all([
    siteSettingsService.getAdmin(),
    homepagePillarService.listAdmin({ page: 1, limit: 50 }),
    homepageCatalogService.listAdmin({ page: 1, limit: 50 }),
    homepageProcessStepService.listAdmin({ page: 1, limit: 50 }),
    testimonialService.listAdmin({ page: 1, limit: 50 }),
    partnerLogoService.listAdmin({ page: 1, limit: 50 }),
  ]);

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Home page'
        description='Hero copy & media, feature pillars, catalog items, process steps, testimonials and partner logos shown on the homepage.'
      />
      <HomePageTabs
        settings={settings ?? null}
        pillars={{ data: pillars.rows, total: pillars.total }}
        catalogItems={{ data: catalogItems.rows, total: catalogItems.total }}
        processSteps={{ data: processSteps.rows, total: processSteps.total }}
        testimonials={{ data: testimonials.rows, total: testimonials.total }}
        partnerLogos={{ data: partnerLogos.rows, total: partnerLogos.total }}
      />
    </div>
  );
}
