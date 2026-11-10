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

const BOILERPLATE = /^\s*(website|business name|last updated|effective date)\s*:/i;
const NUMBERED_HEADING = /^\s*\d+[.)]\s/;

const cut = (full: string, max: number) => {
  if (full.length <= max) return full;
  const head = full.slice(0, max);
  const lastSpace = head.lastIndexOf(' ');
  return `${(lastSpace > 0 ? head.slice(0, lastSpace) : head).trimEnd()}…`;
};

// Plain text of the opening blocks, for a meta description. Policy boilerplate ("Website: ...",
// "Last Updated: ...") and numbered section headings are skipped so it starts with real text.
export function excerptOf(doc: TiptapDoc, max = 160): string {
  const blocks = doc.content.map((node) => ({ node, text: textOf(node).replace(/\s+/g, ' ').trim() }));
  const meaningful = blocks.filter(
    ({ node, text }) => text && !BOILERPLATE.test(text) && !(node.type === 'heading' && NUMBERED_HEADING.test(text)),
  );
  const chosen = meaningful.length ? meaningful : blocks.filter(({ text }) => text);
  return cut(chosen.map(({ text }) => text).join(' '), max);
}
