import type { Metadata } from 'next';
import { ServicesHero } from '@/components/marketing/services-hero';
import { ServiceFeatureBlock } from '@/components/marketing/service-feature-block';
import { cldUrl } from '@/lib/cloudinary/url';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { serviceService } from '@/server/services/service-service';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.',
  alternates: { canonical: '/services' },
};

const CHECKLIST_ICON = '/assets/marketing/icon-checklist-crash.svg';
const FALLBACK_IMAGE = '/assets/marketing/service-crash-repair.jpg';

// Content is CMS-driven (Dashboard → Services) — order and enabled state come from there.
export default async function ServicesPage() {
  const [services, settings] = await Promise.all([serviceService.listPublished(), siteSettingsService.getPublic()]);

  return (
    <>
      <main className='flex flex-col'>
        <ServicesHero
          eyebrow={settings.servicesHeroEyebrow ?? 'Master Craftsmanship'}
          headlineLine1={settings.servicesHeroHeadlineLine1 ?? 'Professional Bodywork.'}
          headlineAccent={settings.servicesHeroHeadlineAccent ?? 'Precision Finish.'}
          subtext={
            settings.servicesHeroSubtext ??
            'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.'
          }
        />

        {services.length > 0 && (
          <div className='container mx-auto flex flex-col gap-16 px-4 py-16 sm:gap-24 sm:px-6 sm:py-24 lg:gap-[120px] lg:px-12 lg:py-[120px]'>
            {services.map((service, index) => (
              <ServiceFeatureBlock
                key={service.id}
                reverse={index % 2 === 1}
                image={
                  service.imagePublicId
                    ? cldUrl(service.imagePublicId, { width: 1200, height: 900, crop: 'fill' })
                    : FALLBACK_IMAGE
                }
                watermark={String(index + 1).padStart(2, '0')}
                heading={service.name}
                description={service.description}
                checklist={service.checklist.map((label) => ({ icon: CHECKLIST_ICON, label }))}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
