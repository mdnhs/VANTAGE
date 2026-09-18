import type { Metadata } from 'next';
import { StitchProcess } from '@/components/marketing/stitch-process';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { resolveProcessPageContent } from '@/features/process-page/defaults';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';

export const metadata: Metadata = {
  title: 'Our Process',
  description:
    'From initial digital triage to strict multi-point handoff inspection, the Vantage repair standard is transparently logged every time.',
  alternates: { canonical: '/process' },
};

export default async function ProcessPage() {
  const [steps, settings] = await Promise.all([
    homepageProcessStepService.listEnabled(),
    siteSettingsService.getPublic(),
  ]);
  const content = resolveProcessPageContent(settings);

  return (
    <main>
      <StitchProcess steps={steps} eyebrow={content.eyebrow} title={content.title} subtext={content.subtext} />
    </main>
  );
}
