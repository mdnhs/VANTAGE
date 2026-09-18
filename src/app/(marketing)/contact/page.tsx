import type { Metadata } from 'next';
import { ContactInfo } from '@/components/marketing/contact-info';
import { ContactForm } from '@/components/marketing/contact-form';
import { VisitUsSection } from '@/components/marketing/visit-us-section';
import { serviceService } from '@/server/services/service-service';

export const metadata: Metadata = {
  title: 'Contact — Vantage Autobody',
  description:
    'We provide precise estimates based on detailed inspections. Reach out to schedule an appointment or ask technical questions.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const services = await serviceService.listPublished();

  return (
    <>
      <main className='container mx-auto flex flex-col gap-16 px-6 py-16 sm:px-12 lg:py-24'>
        <div className='grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16'>
          <ContactInfo />
          <ContactForm services={services} />
        </div>

        <VisitUsSection />
      </main>
    </>
  );
}
