import { getPageMetadata } from '@/server/queries/get-page-seo';
import { PageJsonLd } from '@/components/seo/page-json-ld';
import { ContactInfo } from '@/components/marketing/contact-info';
import { ContactForm } from '@/components/marketing/contact-form';
import { VisitUsSection } from '@/components/marketing/visit-us-section';
import { PageHero, SECTION_BG, SECTION_CONTAINER } from '@/components/marketing/ui/landing-primitives';
import { getSetting } from '@/server/queries/get-setting';
import { serviceService } from '@/server/services/service-service';
import { PageAnimations } from '@/components/marketing/page-animations';

export async function generateMetadata() {
  return getPageMetadata('contact');
}

export default async function ContactPage() {
  const [services, copy] = await Promise.all([serviceService.listPublished(), getSetting('contactForm')]);

  return (
    <main className='grow'>
      <PageJsonLd id='contact' />
      <PageHero
        page='contact'
        eyebrow='Visit · Call · Message'
        lines={['Get in', 'touch.']}
        subtext='We provide precise estimates based on detailed inspections. Reach out to schedule an appointment or ask technical questions.'
      />

      {/* Same bg as the hero, so only bottom padding — the hero already supplies the top rhythm. */}
      <section className={SECTION_BG.base}>
        <div className={`${SECTION_CONTAINER} pb-16 sm:pb-24 xl:pb-[120px]`}>
          <div className='grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-[80px]'>
            <ContactInfo />
            <ContactForm services={services} copy={copy} />
          </div>
        </div>
      </section>

      <VisitUsSection />
      <PageAnimations />
    </main>
  );
}
