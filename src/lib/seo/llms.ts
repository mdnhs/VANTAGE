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

function section(heading: string, all: LlmsLink[], insurance: boolean): string[] {
  const links = insurance
    ? all
    : all.filter(
        (l) => !/\/insurance(?:[/?#]|$)/i.test(l.url) && !INSURANCE_WORDING.test(`${l.title} ${l.description ?? ''}`),
      );
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
  if (i.summary.trim()) lines.push(`> ${oneLine(i.summary)}`, '');
  const details = i.details.map(oneLine).filter(Boolean);
  if (details.length) lines.push(...details.map((d) => `- ${d}`), '');
  lines.push(
    ...section('Pages', i.pages, i.insurance),
    ...section('Services', i.services, i.insurance),
    ...section('Recent work', i.projects, i.insurance),
    ...section('Optional', i.legal, i.insurance),
  );
  return `${lines.join('\n').trimEnd()}\n`;
}
