import { createHash } from 'node:crypto';

// The Lottie logo is a large JSON blob: the log keeps its length and hash so a
// change is visible without storing the document.
export function redactForAudit(key: string, value: unknown): unknown {
  if (key !== 'site') return value;
  const site = value as { lottieLogo?: { json?: unknown } } | null | undefined;
  const json = site?.lottieLogo?.json;
  if (typeof json !== 'string' || !json) return value;
  return {
    ...site,
    lottieLogo: {
      ...site!.lottieLogo,
      json: { length: json.length, sha256: createHash('sha256').update(json).digest('hex') },
    },
  };
}
