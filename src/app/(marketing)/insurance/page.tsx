import type { Metadata } from 'next';
import { InsuranceHero } from '@/components/marketing/insurance-hero';
import { CoordinationSection } from '@/components/marketing/coordination-section';
import { ProcessTimeline } from '@/components/marketing/process-timeline';
import { InsuranceCta } from '@/components/marketing/insurance-cta';
import { PartnerLogosStrip } from '@/components/marketing/partner-logos-strip';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { resolveInsuranceContent } from '@/features/insurance-page/defaults';
import { partnerLogoService } from '@/server/services/partner-logo-service';

export const metadata: Metadata = {
  title: 'Insurance Support',
  description:
    'We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road while our dedicated specialists coordinate seamlessly with your insurance provider.',
  alternates: { canonical: '/insurance' },
};

export default async function InsurancePage() {
  const [partnerLogos, settings] = await Promise.all([
    partnerLogoService.listEnabled(),
    siteSettingsService.getPublic(),
  ]);
  const content = resolveInsuranceContent(settings);

  return (
    <>
      <main>
        <InsuranceHero
          eyebrow={content.heroEyebrow}
          line1={content.heroLine1}
          line2={content.heroLine2}
          line3={content.heroLine3}
          subtext={content.heroSubtext}
        />
        <PartnerLogosStrip logos={partnerLogos} />
        <CoordinationSection
          title={content.coordinationTitle}
          subtext={content.coordinationSubtext}
          features={content.features}
        />
        <ProcessTimeline eyebrow={content.stepsEyebrow} title={content.stepsTitle} steps={content.steps} />
        <InsuranceCta line1={content.ctaLine1} accent={content.ctaAccent} subtext={content.ctaSubtext} />
        <div className='container mx-auto bg-[#131313] px-4 py-8 sm:px-6 md:px-12'>
          <p className='mx-auto max-w-[896px] text-center text-[10px] leading-[15px] tracking-[1px] text-neutral-500 uppercase'>
            {content.disclaimer}
          </p>
        </div>
      </main>
    </>
  );
}
