import { PageHero } from '@/components/marketing/ui/landing-primitives';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';

interface PortfolioHeroProps {
  eyebrow: string;
  headlineLine1: string;
  headlineAccent: string;
  subtext: string;
  video?: PublicImage | null;
  fallbackImage?: PublicImage | null;
  videoEnabled?: boolean;
}

// CMS-driven hero copy (Site Settings → Our Work) rendered through the shared landing PageHero.
export function PortfolioHero({
  eyebrow,
  headlineLine1,
  headlineAccent,
  subtext,
  video = null,
  fallbackImage = null,
  videoEnabled = false,
}: PortfolioHeroProps) {
  return (
    <PageHero
      page='our-work'
      eyebrow={eyebrow}
      lines={[headlineLine1, headlineAccent]}
      subtext={subtext}
      imageSrc={fallbackImage ? sizedSrc(fallbackImage, 'w_1920') : null}
      imageAlt={fallbackImage?.alt}
      video={videoEnabled ? video : null}
    />
  );
}
