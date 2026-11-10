import { oneLine } from '@/server/services/ai/prompt';

const MIN_TEXT = 12;
const KEEP_KEYS_OUT = /(^|\.)(id|slug|href|url|src|alt|icon|image|video|poster|ctaHref|link)$/i;

// Reads the sentences out of a page's settings object: visible copy only, not links, ids or media.
// A { question, answer } pair is kept together so an FAQ stays readable.
export function pageText(value: unknown, max = 3500): string {
  const lines: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (lines.join('\n').length > max) return;
    if (typeof node === 'string') {
      const text = oneLine(node, 600);
      if (text.length < MIN_TEXT || /^(https?:|\/|#|mailto:|tel:)/i.test(text) || KEEP_KEYS_OUT.test(path)) return;
      lines.push(text);
    } else if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}.${i}`));
    } else if (node && typeof node === 'object') {
      const o = node as Record<string, unknown>;
      if (typeof o.question === 'string' && typeof o.answer === 'string') {
        lines.push(`Q: ${oneLine(o.question, 200)} A: ${oneLine(o.answer, 600)}`);
        return;
      }
      for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(value, '');
  const seen = new Set<string>();
  return lines
    .filter((l) => (seen.has(l) ? false : (seen.add(l), true)))
    .join('\n')
    .slice(0, max);
}
