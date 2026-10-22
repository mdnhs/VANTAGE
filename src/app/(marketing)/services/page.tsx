import { sizedSrc } from '@/lib/media/public-image';
import type { Metadata } from 'next';
import { ServicesHero } from '@/components/marketing/services-hero';
import { ServiceFeatureBlock } from '@/components/marketing/service-feature-block';
import {
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { serviceService } from '@/server/services/service-service';
import { PageAnimations } from '@/components/marketing/page-animations';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.',
  alternates: { canonical: '/services' },
};

const FALLBACK_IMAGE = '/assets/marketing/service-crash-repair.jpg';

// Content is CMS-driven (Dashboard → Services) — order and enabled state come from there.
export default async function ServicesPage() {
  const [services, settings] = await Promise.all([serviceService.listPublished(), siteSettingsService.getPublic()]);

  return (
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
        <section className={SECTION_BG.raised}>
          <div className={`${SECTION_CONTAINER} ${SECTION_PADDING} gap-12 lg:gap-16`}>
            <SectionHeader
              eyebrow='Specialist Autobody Divisions'
              title='What We'
              accent='Repair.'
              intro='Comprehensive bodywork, structural restoration and cosmetic refinement using factory-approved techniques.'
            />
            <div className='flex flex-col gap-10 lg:gap-16'>
              {services.map((service, index) => (
                <ServiceFeatureBlock
                  key={service.id}
                  index={index}
                  reverse={index % 2 === 1}
                  image={service.image ? sizedSrc(service.image, 'w_1200,h_900,c_fill') : FALLBACK_IMAGE}
                  imagePosition={
                    service.image ? `${service.image.focal.x * 100}% ${service.image.focal.y * 100}%` : undefined
                  }
                  heading={service.name}
                  description={service.description}
                  checklist={service.checklist}
                  iconSrc={service.icon ? sizedSrc(service.icon, 'w_48,h_48') : undefined}
                  startingPrice={service.startingPrice}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      <PageAnimations />
    </main>
  );
}
