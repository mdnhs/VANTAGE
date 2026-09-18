import type { Metadata } from 'next';
import { StitchHero } from '@/components/marketing/stitch-hero';
import { StitchPillars } from '@/components/marketing/stitch-pillars';
import { StitchServices } from '@/components/marketing/stitch-services';
import { StitchEstimator } from '@/components/marketing/stitch-estimator';
import { StitchCaseStudies } from '@/components/marketing/stitch-case-studies';
import { StitchProcess } from '@/components/marketing/stitch-process';
import { StitchSocialProof } from '@/components/marketing/stitch-social-proof';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { serviceService } from '@/server/services/service-service';
import { testimonialService } from '@/server/services/testimonial-service';
import { partnerLogoService } from '@/server/services/partner-logo-service';

export const metadata: Metadata = {
  title: 'Vantage Autobody — Precision Crash Repair & Restoration Dublin',
  description:
    'Ireland’s premier automotive crash repair, precision chassis reconstruction, laser alignment, and high-end vehicle restoration center in Dublin. OEM certified and insurer approved.',
  alternates: { canonical: '/' },
};

export default async function Home() {
  const [settings, services, testimonials, partnerLogos] = await Promise.all([
    siteSettingsService.getPublic(),
    serviceService.listPublished(),
    testimonialService.listFeatured(),
    partnerLogoService.listEnabled(),
  ]);

  return (
    <div className='flex min-h-screen flex-col bg-[#0d0d0d] text-[#e5e2e1] antialiased selection:bg-[#dc2626] selection:text-white'>
      <main className='grow'>
        <StitchHero
          heroVideoEnabled={settings.heroVideoEnabled}
          heroVideoPublicId={settings.heroVideoPublicId}
          heroFallbackImagePublicId={settings.heroFallbackImagePublicId}
        />
        <StitchPillars />
        <StitchServices services={services} />
        <StitchEstimator />
        <StitchCaseStudies />
        <StitchProcess />
        <StitchSocialProof testimonials={testimonials} partnerLogos={partnerLogos} />
      </main>
    </div>
  );
}
