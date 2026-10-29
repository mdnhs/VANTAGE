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
};

const oneLine = (v: string) => v.replace(/\s+/g, ' ').trim();

function section(heading: string, links: LlmsLink[]): string[] {
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
    ...section('Pages', i.pages),
    ...section('Services', i.services),
    ...section('Recent work', i.projects),
    ...section('Optional', i.legal),
  );
  return `${lines.join('\n').trimEnd()}\n`;
}
