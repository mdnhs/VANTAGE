import type { Metadata } from 'next';
import { StitchHeader } from '@/components/marketing/stitch-header';
import { StitchHero } from '@/components/marketing/stitch-hero';
import { StitchPillars } from '@/components/marketing/stitch-pillars';
import { StitchServices } from '@/components/marketing/stitch-services';
import { StitchEstimator } from '@/components/marketing/stitch-estimator';
import { StitchCaseStudies } from '@/components/marketing/stitch-case-studies';
import { StitchProcess } from '@/components/marketing/stitch-process';
import { StitchSocialProof } from '@/components/marketing/stitch-social-proof';
import { StitchCta } from '@/components/marketing/stitch-cta';
import { StitchFooter } from '@/components/marketing/stitch-footer';

export const metadata: Metadata = {
  title: 'Vantage Autobody — Precision Crash Repair & Restoration Dublin',
  description:
    'Ireland’s premier automotive crash repair, precision chassis reconstruction, laser alignment, and high-end vehicle restoration center in Dublin. OEM certified and insurer approved.',
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <div className='flex min-h-screen flex-col bg-[#0d0d0d] text-[#e5e2e1] antialiased selection:bg-[#dc2626] selection:text-white'>
      <StitchHeader />
      <main className='flex-grow'>
        <StitchHero />
        <StitchPillars />
        <StitchServices />
        <StitchEstimator />
        <StitchCaseStudies />
        <StitchProcess />
        <StitchSocialProof />
        <StitchCta />
      </main>
      <StitchFooter />
    </div>
  );
}
