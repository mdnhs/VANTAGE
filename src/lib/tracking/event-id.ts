// A lead event id for browser/CAPI dedupe. Never throws and never blocks a submit:
// without Web Crypto the id is simply omitted.
type CryptoLike = {
  randomUUID?: () => string;
  getRandomValues?: (a: Uint8Array) => Uint8Array;
};

export function newEventId(c: CryptoLike | null = globalThis.crypto): string | undefined {
  try {
    if (typeof c?.randomUUID === 'function') return c.randomUUID();
    if (typeof c?.getRandomValues === 'function') {
      const b = c.getRandomValues(new Uint8Array(16));
      b[6] = (b[6]! & 0x0f) | 0x40;
      b[8] = (b[8]! & 0x3f) | 0x80;
      const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }
  } catch {
    // fall through
  }
  return undefined;
}
