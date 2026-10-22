import { reachableLinks } from '@/lib/admin/nav';
import type { RoleName } from '@/lib/auth/permissions';
import { matchesSearch } from '@/lib/search/normalize';

export type SearchHit = { id: string; kind: 'page'; label: string; href: string };

// Pages the actor may open, matched on label, section and keywords. Records
// (quotes, media) can join later as further hit kinds.
export function searchNavigation(roles: readonly RoleName[], q: string): SearchHit[] {
  return reachableLinks(roles)
    .filter((link) => matchesSearch(q, [link.label, link.parent ?? '', ...(link.keywords ?? [])]))
    .map((link) => ({
      id: `nav:${link.id}`,
      kind: 'page' as const,
      label: link.parent ? `${link.parent} › ${link.label}` : link.label,
      href: link.href,
    }));
}
