import type { Metadata } from 'next';
import { QuoteHero } from '@/components/marketing/quote-hero';
import { QuoteForm } from '@/components/marketing/quote-form';
import { serviceService } from '@/server/services/service-service';

export const metadata: Metadata = {
  title: 'Get a Free Quote',
  description:
    'Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation estimate from our master technicians.',
  alternates: { canonical: '/get-a-quote' },
};

export default async function GetAQuotePage() {
  const services = await serviceService.listPublished();

  return (
    <>
      <main className='relative overflow-hidden'>
        <div className='pointer-events-none absolute top-0 right-0 h-[800px] w-[427px] bg-gradient-to-b from-red-600/10 to-transparent mix-blend-screen' />
        <div className='pointer-events-none absolute bottom-0 left-0 size-64 rounded-full bg-red-600/10 blur-[50px]' />

        <div className='relative container mx-auto flex flex-col gap-6 px-4 pt-12 pb-20 sm:gap-8 sm:px-6 sm:pt-16 sm:pb-24 md:px-12'>
          <QuoteHero />
          <QuoteForm services={services} />
        </div>
      </main>
    </>
  );
}
