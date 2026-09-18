import type { SiteSettings } from '@/server/db/schema';

// `{count}` in the title is replaced with the number of enabled steps.
export const PROCESS_PAGE_DEFAULTS = {
  eyebrow: 'Predictable & Certified Workflow',
  title: 'The {count}-Step Vantage Standard',
  subtext: 'From initial digital triage to strict multi-point handoff inspection, every step is transparently logged.',
};

export function resolveProcessPageContent(
  s:
    | (Partial<Pick<SiteSettings, 'processPageEyebrow' | 'processPageTitle' | 'processPageSubtext'>> & object)
    | null
    | undefined,
) {
  return {
    eyebrow: s?.processPageEyebrow || PROCESS_PAGE_DEFAULTS.eyebrow,
    title: s?.processPageTitle || PROCESS_PAGE_DEFAULTS.title,
    subtext: s?.processPageSubtext || PROCESS_PAGE_DEFAULTS.subtext,
  };
}
