import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { ContactInfo } from '@/components/marketing/contact-info';
import { ContactForm } from '@/components/marketing/contact-form';
import { VisitUsSection } from '@/components/marketing/visit-us-section';

export const metadata: Metadata = {
  title: 'Contact — Vantage Autobody',
  description:
    'We provide precise estimates based on detailed inspections. Reach out to schedule an appointment or ask technical questions.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <MarketingHeader />
      <main className='flex flex-col gap-16 px-6 py-16 sm:px-12 lg:py-24'>
        <div className='grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16'>
          <ContactInfo />
          <ContactForm />
        </div>

        <VisitUsSection />
      </main>
      <MarketingFooter />
    </>
  );
}
