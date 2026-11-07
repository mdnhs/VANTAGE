import { ButtonLink, PageHero } from '@/components/marketing/ui/landing-primitives';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';

interface InsuranceHeroProps {
  eyebrow: string;
  line1: string;
  line2: string;
  line3: string;
  subtext: string;
  // Settings > Insurance page > Top banner; the bundled workshop shot when no photo is set.
  video?: PublicImage | null;
  fallbackImage?: PublicImage | null;
  videoEnabled?: boolean;
}

// Copy and background are CMS-driven (Site settings → Insurance page); the workshop shot is bundled.
export function InsuranceHero({
  eyebrow,
  line1,
  line2,
  line3,
  subtext,
  video = null,
  fallbackImage = null,
  videoEnabled = false,
}: InsuranceHeroProps) {
  return (
    <PageHero
      page='insurance'
      eyebrow={eyebrow}
      lines={[line1, line2, line3]}
      subtext={subtext}
      imageSrc={fallbackImage ? sizedSrc(fallbackImage, 'w_1920') : '/assets/marketing/insurance-hero.jpg'}
      imageAlt={fallbackImage?.alt || 'Vehicle undergoing precision repair'}
      video={videoEnabled ? video : null}
    >
      <ButtonLink href='/get-a-quote'>Talk to a Specialist</ButtonLink>
    </PageHero>
  );
}
