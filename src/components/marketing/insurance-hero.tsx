import { ButtonLink, PageHero } from '@/components/marketing/ui/landing-primitives';

interface InsuranceHeroProps {
  eyebrow: string;
  line1: string;
  line2: string;
  line3: string;
  subtext: string;
}

// Copy is CMS-driven (Site settings → Insurance page); the workshop shot is bundled.
export function InsuranceHero({ eyebrow, line1, line2, line3, subtext }: InsuranceHeroProps) {
  return (
    <PageHero
      eyebrow={eyebrow}
      lines={[line1, line2, line3]}
      subtext={subtext}
      imageSrc='/assets/marketing/insurance-hero.jpg'
      imageAlt='Vehicle undergoing precision repair'
    >
      <ButtonLink href='/get-a-quote'>Talk to a Specialist</ButtonLink>
    </PageHero>
  );
}
