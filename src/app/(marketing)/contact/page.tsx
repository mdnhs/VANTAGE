import { getPageMetadata } from '@/server/queries/get-page-seo';
import { PageJsonLd } from '@/components/seo/page-json-ld';
import { ContactInfo } from '@/components/marketing/contact-info';
import { ContactForm } from '@/components/marketing/contact-form';
import { VisitUsSection } from '@/components/marketing/visit-us-section';
import { PageHero, SECTION_BG, SECTION_CONTAINER } from '@/components/marketing/ui/landing-primitives';
import { getSetting } from '@/server/queries/get-setting';
import { serviceService } from '@/server/services/service-service';
import { PageAnimations } from '@/components/marketing/page-animations';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { sizedSrc } from '@/lib/media/public-image';

export async function generateMetadata() {
  return getPageMetadata('contact');
}

export default async function ContactPage() {
  const [services, copy, page, settings] = await Promise.all([
    serviceService.listPublished(),
    getSetting('contactForm'),
    getSetting('page.contact'),
    siteSettingsService.getPublic(),
  ]);

  return (
    <main className='grow'>
      <PageJsonLd id='contact' />
      <PageHero
        page='contact'
        eyebrow={page.hero.eyebrow}
        lines={[page.hero.line1, page.hero.accent]}
        subtext={page.hero.subtext}
        imageSrc={settings.contactHeroFallbackImage ? sizedSrc(settings.contactHeroFallbackImage, 'w_1920') : null}
        imageAlt={settings.contactHeroFallbackImage?.alt}
        video={settings.contactHeroVideoEnabled ? settings.contactHeroVideo : null}
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
