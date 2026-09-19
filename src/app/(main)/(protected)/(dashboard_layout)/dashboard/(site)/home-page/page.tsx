import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
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

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function HomePageContentPage() {
  const [settings, pillars, catalogItems, processSteps, testimonials, partnerLogos] = await Promise.all([
    siteSettingsService.getAdmin(),
    homepagePillarService.listAdmin({ page: 1, limit: 50 }),
    homepageCatalogService.listAdmin({ page: 1, limit: 50 }),
    homepageProcessStepService.listAdmin({ page: 1, limit: 50 }),
    testimonialService.listAdmin({ page: 1, limit: 50 }),
    partnerLogoService.listAdmin({ page: 1, limit: 50 }),
  ]);

  return (
    <PermissionGate
      permissions={[
        PERMISSIONS.SETTINGS_MANAGE,
        PERMISSIONS.PILLARS_MANAGE,
        PERMISSIONS.CATALOG_MANAGE,
        PERMISSIONS.PROCESS_MANAGE,
        PERMISSIONS.TESTIMONIALS_MANAGE,
        PERMISSIONS.LOGOS_MANAGE,
      ]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Home page</h1>
          <p className='text-sm text-muted-foreground'>
            Hero copy & media, feature pillars, catalog items, process steps, testimonials and partner logos shown on
            the homepage.
          </p>
        </div>
        <HomePageTabs
          settings={settings ?? null}
          pillars={{ data: pillars.rows, total: pillars.total }}
          catalogItems={{ data: catalogItems.rows, total: catalogItems.total }}
          processSteps={{ data: processSteps.rows, total: processSteps.total }}
          testimonials={{ data: testimonials.rows, total: testimonials.total }}
          partnerLogos={{ data: partnerLogos.rows, total: partnerLogos.total }}
        />
      </div>
    </PermissionGate>
  );
}
