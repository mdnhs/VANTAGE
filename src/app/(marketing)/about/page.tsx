import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { AboutHero } from '@/components/marketing/about-hero';
import { HeritageSection } from '@/components/marketing/heritage-section';
import { TeamSection } from '@/components/marketing/team-section';
import { StandardsSection } from '@/components/marketing/standards-section';

export const metadata: Metadata = {
  title: 'About — Vantage Autobody',
  description:
    "Founded in 1998, Vantage Autobody has evolved into Ireland's premier high-end collision and repair facility.",
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <AboutHero />
        <HeritageSection />
        <TeamSection />
        <StandardsSection />
      </main>
      <MarketingFooter />
    </>
  );
}
