import type { SiteSettings } from '@/server/db/schema';

export interface InsuranceFeature {
  title: string;
  description: string;
}

export interface InsuranceStep {
  label: string;
  description: string;
}

export interface InsuranceContent {
  heroEyebrow: string;
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  heroSubtext: string;
  coordinationTitle: string;
  coordinationSubtext: string;
  features: InsuranceFeature[];
  stepsEyebrow: string;
  stepsTitle: string;
  steps: InsuranceStep[];
  ctaLine1: string;
  ctaAccent: string;
  ctaSubtext: string;
  disclaimer: string;
}

export const INSURANCE_DEFAULTS: InsuranceContent = {
  heroEyebrow: 'Insurance Claims',
  heroLine1: 'Accident Repair',
  heroLine2: 'Without The',
  heroLine3: 'Headache.',
  heroSubtext:
    'We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road while our dedicated specialists coordinate seamlessly with your insurance provider.',
  coordinationTitle: 'Seamless Coordination',
  coordinationSubtext:
    'Our concierge-level claims service is designed to eliminate friction at every step of the repair journey.',
  features: [
    {
      title: 'Direct Insurer Communication',
      description:
        'We bypass the middleman, speaking directly with loss adjusters and assessors to approve your claim faster using specialized industry channels.',
    },
    {
      title: 'Courtesy Car Coordination',
      description:
        'Never be left stranded. We arrange premium replacement vehicles immediately while yours is undergoing its comprehensive restoration.',
    },
    {
      title: 'Transparent Estimates',
      description:
        'Blueprint-level breakdowns of parts, labor, and paint. Total clarity for you and unarguable technical justification for the insurer.',
    },
  ],
  stepsEyebrow: 'The Methodology',
  stepsTitle: '7 Steps to Perfection',
  steps: [
    { label: 'Report', description: 'Drop off your vehicle or let us recover it securely to our facility.' },
    { label: 'Insurer Contact', description: 'We open the dialogue with your provider to establish the claim.' },
    { label: 'Assessment', description: '3D laser scanning and structural diagnostics form a complete blueprint.' },
    { label: 'Approval', description: 'Technical justification secures rapid, uncompromised authorization.' },
    { label: 'Repair', description: 'Our master technicians execute precision bodywork and flawless respraying.' },
    { label: 'Quality Control', description: 'Micron-level paint depth checks and strict safety calibrations.' },
    { label: 'Return', description: 'Vehicle handed back fully valeted, certified, and guaranteed.' },
  ],
  ctaLine1: 'Ready to Hand Over',
  ctaAccent: 'The Keys?',
  ctaSubtext:
    "Connect with our claims team. We'll outline your options in five minutes and set the gears in motion immediately.",
  disclaimer:
    "Disclaimer: courtesy vehicle provision is subject to availability and your specific insurance policy terms. Vantage Autobody operates independently and is legally entitled to repair vehicles insured by all major providers under the 'Right to Choose' directive. Terms and conditions apply.",
};

type InsuranceSource = Partial<
  Pick<
    SiteSettings,
    | 'insuranceHeroEyebrow'
    | 'insuranceHeroLine1'
    | 'insuranceHeroLine2'
    | 'insuranceHeroLine3'
    | 'insuranceHeroSubtext'
    | 'insuranceCoordinationTitle'
    | 'insuranceCoordinationSubtext'
    | 'insuranceFeatures'
    | 'insuranceStepsEyebrow'
    | 'insuranceStepsTitle'
    | 'insuranceSteps'
    | 'insuranceCtaLine1'
    | 'insuranceCtaAccent'
    | 'insuranceCtaSubtext'
    | 'insuranceDisclaimer'
  >
>;

// Blank/unset columns fall back to the design copy so the page never renders empty.
export function resolveInsuranceContent(s: (InsuranceSource & object) | null | undefined): InsuranceContent {
  const d = INSURANCE_DEFAULTS;
  return {
    heroEyebrow: s?.insuranceHeroEyebrow || d.heroEyebrow,
    heroLine1: s?.insuranceHeroLine1 || d.heroLine1,
    heroLine2: s?.insuranceHeroLine2 || d.heroLine2,
    heroLine3: s?.insuranceHeroLine3 || d.heroLine3,
    heroSubtext: s?.insuranceHeroSubtext || d.heroSubtext,
    coordinationTitle: s?.insuranceCoordinationTitle || d.coordinationTitle,
    coordinationSubtext: s?.insuranceCoordinationSubtext || d.coordinationSubtext,
    features: s?.insuranceFeatures?.length ? s.insuranceFeatures : d.features,
    stepsEyebrow: s?.insuranceStepsEyebrow || d.stepsEyebrow,
    stepsTitle: s?.insuranceStepsTitle || d.stepsTitle,
    steps: s?.insuranceSteps?.length ? s.insuranceSteps : d.steps,
    ctaLine1: s?.insuranceCtaLine1 || d.ctaLine1,
    ctaAccent: s?.insuranceCtaAccent || d.ctaAccent,
    ctaSubtext: s?.insuranceCtaSubtext || d.ctaSubtext,
    disclaimer: s?.insuranceDisclaimer || d.disclaimer,
  };
}
