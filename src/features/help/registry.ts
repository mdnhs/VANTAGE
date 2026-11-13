import { HELP_LINK, linkForPath } from '@/lib/admin/nav';
import { hasPermission, type RoleName } from '@/lib/auth/permissions';

import { HELP_DOCS } from './docs';
import type { HelpArticle, HelpBlock, HelpGroupId } from './types';

export type { HelpArticle, HelpBlock, HelpGroupId } from './types';

export const HELP_HREF = HELP_LINK.href;

export const HELP_GROUPS: readonly { id: HelpGroupId; label: string; description: string }[] = [
  { id: 'start', label: 'Getting started', description: 'Finding your way, saving, publishing and the dashboard.' },
  { id: 'website', label: 'Website', description: 'Pages, the home page, services, projects and legal pages.' },
  { id: 'media', label: 'Media', description: 'Upload files, alt text and the media library.' },
  { id: 'inbox', label: 'Enquiries & chat', description: 'Quote pipeline, messages, live chat and notifications.' },
  { id: 'growth', label: 'SEO & marketing', description: 'Search results, redirects, tracking and cookies.' },
  { id: 'settings', label: 'Site settings', description: 'Contact details, menus, emails, AI and colours.' },
  { id: 'team', label: 'Team & account', description: 'People, roles, the activity log and signing in.' },
  { id: 'faq', label: 'Troubleshooting', description: 'Quick answers when something looks wrong.' },
];

// Sidebar order: group by group, articles in the order docs.ts lists them.
export const HELP_ARTICLES: readonly HelpArticle[] = HELP_GROUPS.flatMap((group) =>
  HELP_DOCS.filter((article) => article.group === group.id),
);

export const helpHref = (slug: string) => `${HELP_HREF}/${slug}`;

export function helpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((article) => article.slug === slug);
}

export function canReadArticle(roles: readonly RoleName[], article: HelpArticle): boolean {
  return !article.permission || hasPermission(roles, article.permission);
}

// Articles about screens the viewer cannot open are left out entirely.
export function visibleArticles(roles: readonly RoleName[]): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => canReadArticle(roles, article));
}

export function groupedArticles(roles: readonly RoleName[]) {
  const visible = visibleArticles(roles);
  return HELP_GROUPS.map((group) => ({
    ...group,
    articles: visible.filter((article) => article.group === group.id),
  })).filter((group) => group.articles.length > 0);
}

// The previous and next article in sidebar order, among those visible.
export function neighbours(roles: readonly RoleName[], slug: string) {
  const visible = visibleArticles(roles);
  const at = visible.findIndex((article) => article.slug === slug);
  if (at === -1) return { prev: undefined, next: undefined };
  return { prev: visible[at - 1], next: visible[at + 1] };
}

// "Saving vs publishing" -> "saving-vs-publishing": a section's anchor.
export const headingId = (title: string) =>
  title
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export type TocEntry = { id: string; title: string; level: 2 | 3 };

// "On this page": one entry per section heading, in order, h3s indented.
export function tocFor(article: HelpArticle): TocEntry[] {
  return article.sections.map((section) => ({
    id: headingId(section.title),
    title: section.title,
    level: section.level ?? 2,
  }));
}

// Every string a block holds, for the link checks.
function blockTexts(block: HelpBlock): string[] {
  switch (block.type) {
    case 'p':
    case 'callout':
      return [block.text];
    case 'steps':
    case 'list':
      return [...block.items];
    case 'open':
      return [`[${block.label}](${block.href})`];
    case 'shortcuts':
    case 'owners':
      return [];
  }
}

export function articleTexts(article: HelpArticle): string[] {
  return [
    article.lead,
    ...article.sections.flatMap((section) => [section.title, ...section.blocks.flatMap(blockTexts)]),
  ];
}

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

// Every href an article links to, in-text links and "open" buttons alike.
export function articleLinks(article: HelpArticle): string[] {
  return articleTexts(article).flatMap((text) => [...text.matchAll(LINK)].map((match) => match[2]!));
}

// Whether the viewer may follow a link: another help article they can read,
// or an admin screen their role opens. Anything else renders as plain text.
export function canFollow(roles: readonly RoleName[], href: string): boolean {
  const path = href.split('#')[0]!;
  if (path === HELP_HREF) return true;
  if (path.startsWith(`${HELP_HREF}/`)) {
    const article = helpArticle(path.slice(HELP_HREF.length + 1));
    return article ? canReadArticle(roles, article) : false;
  }
  const link = linkForPath(path);
  return link ? hasPermission(roles, link.permission) : false;
}
