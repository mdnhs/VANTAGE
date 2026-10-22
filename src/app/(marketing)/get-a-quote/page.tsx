import type { Metadata } from 'next';
import { QuoteHero } from '@/components/marketing/quote-hero';
import { QuoteForm } from '@/components/marketing/quote-form';
import { SECTION_BG, SECTION_CONTAINER } from '@/components/marketing/ui/landing-primitives';
import { getSetting } from '@/server/queries/get-setting';
import { serviceService } from '@/server/services/service-service';
import { PageAnimations } from '@/components/marketing/page-animations';

export const metadata: Metadata = {
  title: 'Get a Free Quote',
  description:
    'Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation estimate from our master technicians.',
  alternates: { canonical: '/get-a-quote' },
};

export default async function GetAQuotePage() {
  const [services, copy] = await Promise.all([serviceService.listPublished(), getSetting('quoteForm')]);

  return (
    <main>
      <QuoteHero />
      {/* Hero already carries the top rhythm, so this band only pads the bottom */}
      <section id='quote-form' className={`w-full ${SECTION_BG.base} pb-16 sm:pb-24 xl:pb-[120px]`}>
        <div className={SECTION_CONTAINER}>
          <QuoteForm services={services} copy={copy} />
        </div>
      </section>
      <PageAnimations />
    </main>
  );
}
