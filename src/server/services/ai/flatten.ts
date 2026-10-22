export const TEXT_LIMIT = 8000;

// Keys that hold structure or media references, not words a writer would read.
const SKIP_KEYS = new Set(['kind', 'id', 'publicId', 'mediaId', 'url', 'href', 'json', 'e164']);
const MEDIA_KEY = /(image|video|logo|favicon|poster|photo|icon)$/i;
const NOT_PROSE = /^(https?:|\/|#)|^[0-9a-f-]{36}$/i;

export function clip(text: string, limit = TEXT_LIMIT): string {
  return text.length > limit ? text.slice(0, limit) : text;
}

// Walks a global's JSON depth-first and emits the non-empty strings a person would read.
export function flattenValue(value: unknown, limit = TEXT_LIMIT): string {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      const t = node.trim();
      if (t && /\p{L}/u.test(t) && !NOT_PROSE.test(t)) out.push(t);
      return;
    }
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [key, child] of Object.entries(node)) {
      if (!SKIP_KEYS.has(key) && !MEDIA_KEY.test(key)) walk(child);
    }
  };
  walk(value);
  return clip(out.join('\n'), limit);
}
