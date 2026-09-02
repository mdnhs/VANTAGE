import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { ServicesHero } from '@/components/marketing/services-hero';
import { ServiceFeatureBlock } from '@/components/marketing/service-feature-block';
import { ServiceSplitCards } from '@/components/marketing/service-split-card';

export const metadata: Metadata = {
  title: 'Services — Vantage Autobody',
  description:
    'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return (
    <>
      <MarketingHeader />
      <main className='flex flex-col'>
        <ServicesHero />

        <div className='flex flex-col gap-[120px] px-6 py-[120px] sm:px-12'>
          <ServiceFeatureBlock
            image='/assets/marketing/service-crash-repair.jpg'
            watermark='01'
            heading='Crash Repair'
            description='Structural integrity is paramount. We utilize laser measuring systems and factory-approved alignment jigs to ensure your chassis is restored to exact OEM tolerances after a collision.'
            checklist={[
              { icon: '/assets/marketing/icon-checklist-crash.svg', label: 'Structural Realignment' },
              { icon: '/assets/marketing/icon-checklist-crash.svg', label: 'Laser Chassis Measuring' },
              { icon: '/assets/marketing/icon-checklist-crash.svg', label: 'Factory Panel Welding' },
            ]}
          />

          <ServiceSplitCards />

          <ServiceFeatureBlock
            reverse
            image='/assets/marketing/service-paintwork.jpg'
            watermark='02'
            heading='Precision Paintwork'
            description='From localized blending to complete bare-metal resprays, our climate-controlled downdraft booths ensure a glass-like finish. We use computerized color matching for an undetectable repair.'
            checklist={[
              { icon: '/assets/marketing/icon-checklist-paint-1.svg', label: 'Computerized Color Matching' },
              { icon: '/assets/marketing/icon-checklist-paint-2.svg', label: 'Multi-stage Clearcoat' },
              { icon: '/assets/marketing/icon-checklist-paint-3.svg', label: 'Full Factory Resprays' },
            ]}
          />
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
