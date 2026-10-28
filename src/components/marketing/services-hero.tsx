import { ButtonLink, PageHero } from '@/components/marketing/ui/landing-primitives';

interface ServicesHeroProps {
  eyebrow: string;
  headlineLine1: string;
  headlineAccent: string;
  subtext: string;
}

export function ServicesHero({ eyebrow, headlineLine1, headlineAccent, subtext }: ServicesHeroProps) {
  return (
    <PageHero
      page='services'
      eyebrow={eyebrow}
      lines={[headlineLine1, headlineAccent]}
      subtext={subtext}
      imageSrc='/assets/marketing/services-hero.jpg'
      imageAlt='Vantage Autobody workshop'
    >
      <ButtonLink href='/get-a-quote'>Get a quote</ButtonLink>
      <ButtonLink href='/process' variant='secondary'>
        Our process
      </ButtonLink>
    </PageHero>
  );
}
