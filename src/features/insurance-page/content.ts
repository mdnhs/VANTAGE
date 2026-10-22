import { parseGlobal } from '@/lib/content/globals';
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

// The design copy lives in the page.insurance schema (src/lib/content/globals-*.ts); this reads it.
function insuranceDefaults(): InsuranceContent {
  const i = parseGlobal('page.insurance', undefined);
  return {
    heroEyebrow: i.hero.eyebrow,
    heroLine1: i.hero.line1,
    heroLine2: i.hero.line2,
    heroLine3: i.hero.line3,
    heroSubtext: i.hero.subtext,
    coordinationTitle: i.coordination.title,
    coordinationSubtext: i.coordination.subtext,
    features: i.coordination.features,
    stepsEyebrow: i.steps.eyebrow,
    stepsTitle: i.steps.title,
    steps: i.steps.items,
    ctaLine1: i.cta.line1,
    ctaAccent: i.cta.accent,
    ctaSubtext: i.cta.subtext,
    disclaimer: i.disclaimer,
  };
}

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
  const d = insuranceDefaults();
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
