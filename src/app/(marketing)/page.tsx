import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { HeroSection } from '@/components/marketing/hero-section';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { ServicesSection } from '@/components/marketing/services-section';
import { MarketingFooter } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Vantage Autobody — Precision Crash Repair & Restoration',
  description:
    'Professional crash repair, structural bodywork, precision paint, and high-end vehicle restoration in Ireland. Your vehicle, our obsession.',
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <>
      <MarketingHeader />
      <main>
        <HeroSection />
        <TrustStrip />
        <ServicesSection />
      </main>
      <MarketingFooter />
    </>
  );
}
