import type { Metadata } from 'next';
import { StitchProcess } from '@/components/marketing/stitch-process';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';

export const metadata: Metadata = {
  title: 'Our Process',
  description:
    'From initial digital triage to strict multi-point handoff inspection, the Vantage repair standard is transparently logged every time.',
  alternates: { canonical: '/process' },
};

export default async function ProcessPage() {
  const steps = await homepageProcessStepService.listEnabled();

  return (
    <main>
      <StitchProcess steps={steps} />
    </main>
  );
}
