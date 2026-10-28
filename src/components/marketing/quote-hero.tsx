import { PageHero } from '@/components/marketing/ui/landing-primitives';

export function QuoteHero() {
  return (
    <PageHero
      page='get-a-quote'
      eyebrow='Free Online Quotation'
      lines={['Get your repair', 'quote.']}
      subtext='Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation estimate from our master technicians.'
    />
  );
}
