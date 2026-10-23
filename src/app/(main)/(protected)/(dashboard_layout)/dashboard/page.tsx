import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { getDashboard } from '@/server/services/dashboard-service';
import { DashboardOverviewView } from '@/features/dashboard-overview/components/dashboard-overview-view';
import { hasPermission } from '@/lib/auth/permissions';
import { homepagePillarService } from '@/server/services/homepage-pillar-service';
import { homepageCatalogService } from '@/server/services/homepage-catalog-service';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { testimonialService } from '@/server/services/testimonial-service';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import type { HomePageTabsProps } from '@/features/home-page/components/home-page-tabs';

export const metadata: Metadata = {
  title: 'Operations & Website Dashboard',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via the layout) per request — must not be prerendered.
export const instant = false;

export default async function DashboardPage() {
  const actor = await requirePermission(permissionFor('/dashboard'));
  const renderedAt = new Date().toISOString();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const canReadWebsite = hasPermission(actor.roles, { page: ['read'] });

  const [dashboard, websiteData] = await Promise.all([
    getDashboard(actor).catch((error) => {
      console.error('dashboard failed to load', error);
      return null;
    }),
    canReadWebsite
      ? Promise.all([
          homepagePillarService.listAdmin({ page: 1, limit: 50 }),
          homepageCatalogService.listAdmin({ page: 1, limit: 50 }),
          homepageProcessStepService.listAdmin({ page: 1, limit: 50 }),
          testimonialService.listAdmin({ page: 1, limit: 50 }),
          partnerLogoService.listAdmin({ page: 1, limit: 50 }),
        ])
          .then(([pillars, catalogItems, processSteps, testimonials, partnerLogos]): HomePageTabsProps => ({
            pillars: { data: pillars.rows, total: pillars.total },
            catalogItems: { data: catalogItems.rows, total: catalogItems.total },
            processSteps: { data: processSteps.rows, total: processSteps.total },
            testimonials: { data: testimonials.rows, total: testimonials.total },
            partnerLogos: { data: partnerLogos.rows, total: partnerLogos.total },
          }))
          .catch((error) => {
            console.error('website data failed to load for dashboard', error);
            return null;
          })
      : Promise.resolve(null),
  ]);

  return (
    <DashboardOverviewView
      adminName={actor.name}
      renderedAt={renderedAt}
      siteUrl={siteUrl}
      dashboard={dashboard}
      websiteData={websiteData}
    />
  );
}
