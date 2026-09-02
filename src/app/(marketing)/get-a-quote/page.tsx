import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { QuoteHero } from '@/components/marketing/quote-hero';
import { QuoteForm } from '@/components/marketing/quote-form';

export const metadata: Metadata = {
  title: 'Get a Free Quote — Vantage Autobody',
  description:
    'Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation estimate from our master technicians.',
  alternates: { canonical: '/get-a-quote' },
};

export default function GetAQuotePage() {
  return (
    <>
      <MarketingHeader />
      <main className='relative overflow-hidden'>
        <div className='pointer-events-none absolute top-0 right-0 h-[800px] w-[427px] bg-gradient-to-b from-[rgba(255,180,171,0.05)] to-transparent mix-blend-screen' />
        <div className='pointer-events-none absolute bottom-0 left-0 size-64 rounded-full bg-[rgba(255,180,171,0.05)] blur-[50px]' />

        <div className='relative flex flex-col gap-8 px-6 pt-16 pb-24 sm:px-12'>
          <QuoteHero />
          <QuoteForm />
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
