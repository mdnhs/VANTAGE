import { visibleCopy } from '@/lib/features';
import { getInsuranceEnabled } from '@/server/queries/get-features';
import { QuoteButton } from '@/components/marketing/quote-cta';
import { getPageMetadata } from '@/server/queries/get-page-seo';
import { PageJsonLd } from '@/components/seo/page-json-ld';
import { StitchProcess } from '@/components/marketing/stitch-process';
import { ButtonLink, PageHero } from '@/components/marketing/ui/landing-primitives';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { resolveProcessPageContent } from '@/features/process-page/content';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { ProcessTimelineDesktop } from '@/components/marketing/desktop-step-timelines';
import { PageAnimations } from '@/components/marketing/page-animations';
import { sizedSrc } from '@/lib/media/public-image';

export async function generateMetadata() {
  return getPageMetadata('process');
}

// Splits the CMS title into hero lines — the last two words become the red accent line.
function toHeroLines(title: string): string[] {
  const words = title.split(' ');
  if (words.length <= 2) return [title];
  return [words.slice(0, -2).join(' '), words.slice(-2).join(' ')];
}

export default async function ProcessPage() {
  const [allSteps, settings, insurance] = await Promise.all([
    homepageProcessStepService.listEnabled(),
    siteSettingsService.getPublic(),
    getInsuranceEnabled(),
  ]);
  // A repair step about insurance is left out while the admin switch is off.
  const steps = allSteps.filter((step) => visibleCopy(insurance, step.title, step.description));
  const content = resolveProcessPageContent(settings);
  const title = content.title.replace('{count}', String(steps.length));

  // The CMS eyebrow/title/subtext lead the page in the hero; the phase slider below gets a short
  // section heading of its own so the same headline isn't repeated twice.
  return (
    <main className='flex flex-col'>
      <PageJsonLd id='process' />
      <PageHero
        page='process'
        eyebrow={content.eyebrow}
        lines={toHeroLines(title)}
        subtext={content.subtext}
        imageSrc={settings.processPageFallbackImage ? sizedSrc(settings.processPageFallbackImage, 'w_1920') : null}
        imageAlt={settings.processPageFallbackImage?.alt}
        video={settings.processPageVideoEnabled ? settings.processPageVideo : null}
      >
        <QuoteButton />
        <ButtonLink href='/services' variant='secondary'>
          Our services
        </ButtonLink>
      </PageHero>
      <div className='lg:hidden'>
        <StitchProcess steps={steps} eyebrow='Phase by phase' title='Every Step, Fully Logged.' />
      </div>
      <ProcessTimelineDesktop
        eyebrow='Phase by phase'
        title='Every Step, Fully Logged.'
        steps={steps.map((step) => ({ title: step.title, description: step.description }))}
      />
      <PageAnimations />
    </main>
  );
}
