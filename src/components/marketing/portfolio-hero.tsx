import { PageHero } from '@/components/marketing/ui/landing-primitives';

interface PortfolioHeroProps {
  eyebrow: string;
  headlineLine1: string;
  headlineAccent: string;
  subtext: string;
}

// CMS-driven hero copy (Site Settings → Our Work) rendered through the shared landing PageHero.
export function PortfolioHero({ eyebrow, headlineLine1, headlineAccent, subtext }: PortfolioHeroProps) {
  return <PageHero page='our-work' eyebrow={eyebrow} lines={[headlineLine1, headlineAccent]} subtext={subtext} />;
}
