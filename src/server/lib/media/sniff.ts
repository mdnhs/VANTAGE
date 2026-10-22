import 'server-only';

// The allowlist is checked against the bytes, never the filename or the
// browser's Content-Type. SVG is not on it (script).
export type Sniffed =
  | { mime: 'image/jpeg'; ext: 'jpg' }
  | { mime: 'image/png'; ext: 'png' }
  | { mime: 'image/webp'; ext: 'webp' }
  | { mime: 'image/avif'; ext: 'avif' }
  | { mime: 'application/pdf'; ext: 'pdf' }
  | { mime: 'video/mp4'; ext: 'mp4' }
  | { mime: 'video/webm'; ext: 'webm' };

export function sniff(bytes: Uint8Array): Sniffed | null {
  const at = (offset: number, signature: readonly number[]) => signature.every((byte, i) => bytes[offset + i] === byte);
  const ascii = (offset: number, text: string) =>
    at(
      offset,
      [...text].map((ch) => ch.charCodeAt(0)),
    );
  if (at(0, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: 'png' };
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return { mime: 'image/webp', ext: 'webp' };
  if (ascii(4, 'ftyp') && (ascii(8, 'avif') || ascii(8, 'avis'))) return { mime: 'image/avif', ext: 'avif' };
  if (ascii(0, '%PDF-')) return { mime: 'application/pdf', ext: 'pdf' };
  // Any other ISO base media file (ftyp box at offset 4) is treated as mp4.
  if (ascii(4, 'ftyp')) return { mime: 'video/mp4', ext: 'mp4' };
  // EBML header magic.
  if (at(0, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: 'video/webm', ext: 'webm' };
  return null;
}
