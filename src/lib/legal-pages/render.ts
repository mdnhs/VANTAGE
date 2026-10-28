import { generateHTML } from '@tiptap/html/server';
import { tiptapDocSchema, type TiptapDoc, type TiptapNode } from '@/validations/legal-page-schema';
import { legalExtensions } from './extensions';

const isExternal = (href: string) => /^https?:\/\//i.test(href);

// External links open in a new tab without handing over `window.opener`; site links stay put.
function withLinkTargets(node: TiptapNode): TiptapNode {
  return {
    ...node,
    marks: node.marks?.map((mark) =>
      mark.type === 'link'
        ? {
            ...mark,
            attrs: isExternal(String(mark.attrs.href))
              ? { ...mark.attrs, target: '_blank', rel: 'noopener noreferrer' }
              : { ...mark.attrs, target: null, rel: null },
          }
        : mark,
    ),
    content: node.content?.map(withLinkTargets),
  };
}

// Stored content was validated on write; it is re-checked here so a bad row renders as an
// empty body rather than unsafe markup or a crashed page.
export function renderLegalHtml(doc: TiptapDoc): string {
  const parsed = tiptapDocSchema.safeParse(doc);
  if (!parsed.success) {
    console.error('[legal-pages] stored content failed validation; rendering an empty body');
    return '';
  }
  const { content, ...rest } = parsed.data;
  return generateHTML({ ...rest, content: content.map(withLinkTargets) }, legalExtensions);
}

function textOf(node: TiptapNode): string {
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(textOf).join('');
}

// Plain text of the opening blocks, for a meta description.
export function excerptOf(doc: TiptapDoc, max = 160): string {
  const full = doc.content.map(textOf).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (full.length <= max) return full;
  const cut = full.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
