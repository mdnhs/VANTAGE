import { PUBLIC_PAGES, type PublicPageId } from './public-pages';

export type TitleDefaults = { titleTemplate: string; siteName: string };

// The template every non-home title goes through; blank falls back to "<title> | <site name>".
export function effectiveTemplate(d: TitleDefaults): string {
  const t = d.titleTemplate.trim();
  return t.includes('%s') ? t : `%s | ${d.siteName}`;
}

// The one place the final <title> is decided, so the length and uniqueness checks measure what ships.
export function documentTitle(s: { id: PublicPageId; seoTitle: string | null | undefined }, d: TitleDefaults): string {
  const seoTitle = s.seoTitle?.trim() || null;
  const page = PUBLIC_PAGES[s.id];
  // Home carries its own full title, so it ignores the template (as today).
  if (s.id === 'home') return seoTitle ?? `${d.siteName} — ${page.title}`;
  const own = seoTitle ?? page.title;
  // A replacer function keeps "$&" and friends in the title literal.
  return effectiveTemplate(d).replace('%s', () => own);
}
