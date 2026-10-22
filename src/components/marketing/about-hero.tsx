import { cldUrl } from '@/lib/cloudinary/url';
import { ABOUT_FALLBACK_IMAGES } from '@/features/about-page/defaults';
import { PageHero } from '@/components/marketing/ui/landing-primitives';

interface AboutHeroProps {
  eyebrow: string;
  line1: string;
  accent1: string;
  line2: string;
  accent2: string;
  imagePublicId: string | null;
}

// Two CMS-driven lines ("Built on Craft." / "Driven by Quality."); PageHero paints the last one red.
export function AboutHero({ eyebrow, line1, accent1, line2, accent2, imagePublicId }: AboutHeroProps) {
  return (
    <PageHero
      eyebrow={eyebrow}
      lines={[`${line1} ${accent1}.`, `${line2} ${accent2}.`]}
      imageSrc={imagePublicId ? cldUrl(imagePublicId, { width: 1920 }) : ABOUT_FALLBACK_IMAGES.hero}
      imageAlt='Vantage Autobody workshop'
    />
  );
}
