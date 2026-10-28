import { getPageMetadata } from '@/server/queries/get-page-seo';
import { PageJsonLd } from '@/components/seo/page-json-ld';
import { StitchProcess } from '@/components/marketing/stitch-process';
import { ButtonLink, PageHero } from '@/components/marketing/ui/landing-primitives';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { resolveProcessPageContent } from '@/features/process-page/content';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { PageAnimations } from '@/components/marketing/page-animations';

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
  const [steps, settings] = await Promise.all([
    homepageProcessStepService.listEnabled(),
    siteSettingsService.getPublic(),
  ]);
  const content = resolveProcessPageContent(settings);
  const title = content.title.replace('{count}', String(steps.length));

  // The CMS eyebrow/title/subtext lead the page in the hero; the phase slider below gets a short
  // section heading of its own so the same headline isn't repeated twice.
  return (
    <main className='flex flex-col'>
      <PageJsonLd id='process' />
      <PageHero page='process' eyebrow={content.eyebrow} lines={toHeroLines(title)} subtext={content.subtext}>
        <ButtonLink href='/get-a-quote'>Get a quote</ButtonLink>
        <ButtonLink href='/services' variant='secondary'>
          Our services
        </ButtonLink>
      </PageHero>
      <StitchProcess steps={steps} eyebrow='Phase by phase' title='Every Step, Fully Logged.' />
      <PageAnimations />
    </main>
  );
}
