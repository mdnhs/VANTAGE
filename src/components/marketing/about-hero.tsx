import { sizedSrc, type PublicImage } from '@/lib/media/public-image';
import { ABOUT_FALLBACK_IMAGES } from '@/features/about-page/content';
import { PageHero } from '@/components/marketing/ui/landing-primitives';

interface AboutHeroProps {
  eyebrow: string;
  line1: string;
  accent1: string;
  line2: string;
  accent2: string;
  image: PublicImage | null;
}

// Two CMS-driven lines ("Built on Craft." / "Driven by Quality."); PageHero paints the last one red.
export function AboutHero({ eyebrow, line1, accent1, line2, accent2, image }: AboutHeroProps) {
  return (
    <PageHero
      page='about'
      eyebrow={eyebrow}
      lines={[`${line1} ${accent1}.`, `${line2} ${accent2}.`]}
      imageSrc={image ? sizedSrc(image, 'w_1920') : ABOUT_FALLBACK_IMAGES.hero}
      imageAlt='Car body repair workshop in Dublin'
    />
  );
}
