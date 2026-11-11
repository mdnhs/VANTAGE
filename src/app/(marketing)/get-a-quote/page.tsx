import { getPageMetadata } from '@/server/queries/get-page-seo';
import { PageJsonLd } from '@/components/seo/page-json-ld';
import { StitchEstimator } from '@/components/marketing/stitch-estimator';
import { PageHero } from '@/components/marketing/ui/landing-primitives';
import { sizedSrc } from '@/lib/media/public-image';
import { getSetting } from '@/server/queries/get-setting';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { PageAnimations } from '@/components/marketing/page-animations';
import { ScrollToQuoteForm } from '@/components/marketing/scroll-to-quote-form';

export async function generateMetadata() {
  return getPageMetadata('get-a-quote');
}

export default async function GetAQuotePage() {
  const [copy, page, home, settings] = await Promise.all([
    getSetting('quoteForm'),
    getSetting('page.get-a-quote'),
    getSetting('page.home'),
    siteSettingsService.getPublic(),
  ]);

  return (
    <main>
      <PageJsonLd id='get-a-quote' />
      <PageHero
        page='get-a-quote'
        eyebrow={page.hero.eyebrow}
        lines={[page.hero.line1, page.hero.accent]}
        subtext={page.hero.subtext}
        imageSrc={settings.quoteHeroFallbackImage ? sizedSrc(settings.quoteHeroFallbackImage, 'w_1920') : undefined}
        imageAlt={settings.quoteHeroFallbackImage?.alt}
        video={settings.quoteHeroVideoEnabled ? settings.quoteHeroVideo : null}
      />
      <StitchEstimator
        copy={copy}
        heading={home.quoteSection}
        source='quote_page'
        whatsappNumber={settings.whatsappNumber || settings.phone}
      />
      <PageAnimations />
      <ScrollToQuoteForm />
    </main>
  );
}
