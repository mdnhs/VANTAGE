import type { Metadata } from 'next';
import { StitchProcess } from '@/components/marketing/stitch-process';

export const metadata: Metadata = {
  title: 'Our Process — Vantage Autobody',
  description:
    'From initial digital triage to strict multi-point handoff inspection, the 5-step Vantage repair standard is transparently logged every time.',
  alternates: { canonical: '/process' },
};

export default function ProcessPage() {
  return (
    <main>
      <StitchProcess />
    </main>
  );
}
