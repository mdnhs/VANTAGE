import { parseGlobal } from '@/lib/content/globals';
import type { SiteSettings } from '@/server/db/schema';

// `{count}` in the title is replaced with the number of enabled steps.
// The design copy lives in the page.process schema (src/lib/content/globals-*.ts).
export function resolveProcessPageContent(
  s:
    | (Partial<Pick<SiteSettings, 'processPageEyebrow' | 'processPageTitle' | 'processPageSubtext'>> & object)
    | null
    | undefined,
) {
  const d = parseGlobal('page.process', undefined);
  return {
    eyebrow: s?.processPageEyebrow || d.eyebrow,
    title: s?.processPageTitle || d.title,
    subtext: s?.processPageSubtext || d.subtext,
  };
}
