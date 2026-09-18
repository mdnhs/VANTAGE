import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { HeroSection } from '@/components/marketing/hero-section';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { PartnerLogosStrip } from '@/components/marketing/partner-logos-strip';
import { ServicesSection } from '@/components/marketing/services-section';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { MarketingFooter } from '@/components/marketing/footer';
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
    <>
      <MarketingHeader />
      <main>
        <HeroSection
          heroVideoEnabled={settings.heroVideoEnabled}
          heroVideoPublicId={settings.heroVideoPublicId}
          heroFallbackImagePublicId={settings.heroFallbackImagePublicId}
        />
        <TrustStrip />
        <PartnerLogosStrip logos={partnerLogos} />
        <ServicesSection services={services} />
        <TestimonialsSection testimonials={testimonials} />
      </main>
      <MarketingFooter />
    </>
  );
}
