import { ButtonLink, PageHero } from '@/components/marketing/ui/landing-primitives';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';

interface ServicesHeroProps {
  eyebrow: string;
  headlineLine1: string;
  headlineAccent: string;
  subtext: string;
  // Settings > Services page > Top banner; the built-in workshop photo when no photo is set.
  video?: PublicImage | null;
  fallbackImage?: PublicImage | null;
  videoEnabled?: boolean;
}

export function ServicesHero({
  eyebrow,
  headlineLine1,
  headlineAccent,
  subtext,
  video = null,
  fallbackImage = null,
  videoEnabled = false,
}: ServicesHeroProps) {
  return (
    <PageHero
      page='services'
      eyebrow={eyebrow}
      lines={[headlineLine1, headlineAccent]}
      subtext={subtext}
      imageSrc={fallbackImage ? sizedSrc(fallbackImage, 'w_1920') : '/assets/marketing/services-hero.jpg'}
      imageAlt={fallbackImage?.alt || 'Car body repair workshop in Dublin'}
      video={videoEnabled ? video : null}
    >
      <ButtonLink href='/get-a-quote'>Get a quote</ButtonLink>
      <ButtonLink href='/process' variant='secondary'>
        Our process
      </ButtonLink>
    </PageHero>
  );
}
