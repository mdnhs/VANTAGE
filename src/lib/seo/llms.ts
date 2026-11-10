// /llms.txt (llmstxt.org): the site as Markdown for AI assistants: H1 name, a summary quote,
// the business details, then linked sections. Legal pages go under "Optional", which tools may skip.
export type LlmsLink = { title: string; url: string; description?: string | null };

export type LlmsInput = {
  siteName: string;
  summary: string;
  details: string[];
  pages: LlmsLink[];
  services: LlmsLink[];
  projects: LlmsLink[];
  legal: LlmsLink[];
  // The admin's "Show the Insurance page" switch: off drops insurance links and wording.
  insurance: boolean;
};

const oneLine = (v: string) => v.replace(/\s+/g, ' ').trim();

const INSURANCE_WORDING = /insur|\bclaims?\b|\bloss adjuster/i;
const INSURANCE_URL = /\/insurance(?:[/?#]|$)/i;

// Off: links to the Insurance page, or titled with insurance wording, are dropped; a description
// that talks about insurance is left off the line and the link stays.
function section(heading: string, all: LlmsLink[], hideInsurance: boolean): string[] {
  const links = !hideInsurance
    ? all
    : all
        .filter((l) => !INSURANCE_URL.test(l.url) && !INSURANCE_WORDING.test(l.title))
        .map((l) => (l.description && INSURANCE_WORDING.test(l.description) ? { ...l, description: null } : l));
  if (!links.length) return [];
  return [
    `## ${heading}`,
    '',
    ...links.map((l) => {
      const description = l.description ? oneLine(l.description) : '';
      return `- [${oneLine(l.title)}](${l.url})${description ? `: ${description}` : ''}`;
    }),
    '',
  ];
}

export function llmsText(i: LlmsInput): string {
  const lines = [`# ${oneLine(i.siteName)}`, ''];
  const summary = i.insurance || !INSURANCE_WORDING.test(i.summary) ? i.summary : '';
  if (summary.trim()) lines.push(`> ${oneLine(summary)}`, '');
  const details = i.details.map(oneLine).filter(Boolean);
  if (details.length) lines.push(...details.map((d) => `- ${d}`), '');
  lines.push(
    // Only the site's own pages follow the switch; services, projects and legal pages are rows the
    // owner published on purpose and are listed as written.
    ...section('Pages', i.pages, !i.insurance),
    ...section('Services', i.services, false),
    ...section('Recent work', i.projects, false),
    ...section('Optional', i.legal, false),
  );
  return `${lines.join('\n').trimEnd()}\n`;
}
