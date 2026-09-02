import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { InsuranceHero } from '@/components/marketing/insurance-hero';
import { CoordinationSection } from '@/components/marketing/coordination-section';
import { ProcessTimeline } from '@/components/marketing/process-timeline';
import { InsuranceCta } from '@/components/marketing/insurance-cta';

export const metadata: Metadata = {
  title: 'Insurance Support — Vantage Autobody',
  description:
    'We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road while our dedicated specialists coordinate seamlessly with your insurance provider.',
  alternates: { canonical: '/insurance' },
};

export default function InsurancePage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <InsuranceHero />
        <CoordinationSection />
        <ProcessTimeline />
        <InsuranceCta />
        <div className='bg-[#131313] px-6 py-8 sm:px-12'>
          <p className='mx-auto max-w-[896px] text-center text-[10px] leading-[15px] tracking-[1px] text-[#e6bdb8]/50 uppercase'>
            Disclaimer: courtesy vehicle provision is subject to availability and your specific insurance policy terms.
            Vantage Autobody operates independently and is legally entitled to repair vehicles insured by all major
            providers under the &apos;Right to Choose&apos; directive. Terms and conditions apply.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
