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
  if (ascii(4, 'ftyp') && isMp4Brand(bytes)) return { mime: 'video/mp4', ext: 'mp4' };
  if (at(0, [0x1a, 0x45, 0xdf, 0xa3]) && ebmlDocType(bytes) === 'webm') return { mime: 'video/webm', ext: 'webm' };
  return null;
}

const MP4_BRANDS = new Set(['isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'M4V ', 'dash']);
// QuickTime, HEIF, audio-only and 3GPP containers are not accepted as video.
const isDeniedBrand = (brand: string) =>
  brand === 'qt  ' || ['heic', 'heix', 'mif1', 'msf1', 'M4A '].includes(brand) || brand.startsWith('3gp');

// The ftyp major brand (bytes 8-11) or a compatible brand (16..box size) must
// be on the allowlist, and the major brand must not be a denied one.
function isMp4Brand(bytes: Uint8Array) {
  const text = (offset: number) => String.fromCharCode(...Array.from(bytes.subarray(offset, offset + 4)));
  if (bytes.length < 12) return false;
  const major = text(8);
  if (isDeniedBrand(major)) return false;
  if (MP4_BRANDS.has(major)) return true;
  const size = Math.min(
    ((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>> 0,
    256,
    bytes.length,
  );
  for (let offset = 16; offset + 4 <= size; offset += 4) {
    if (MP4_BRANDS.has(text(offset))) return true;
  }
  return false;
}

// The EBML DocType element (id 0x4282) within the header: 'webm' or 'matroska'.
function ebmlDocType(bytes: Uint8Array) {
  const limit = Math.min(bytes.length, 64);
  for (let i = 4; i + 3 < limit; i++) {
    if (bytes[i] === 0x42 && bytes[i + 1] === 0x82) {
      const length = bytes[i + 2]! & 0x7f;
      return String.fromCharCode(...Array.from(bytes.subarray(i + 3, i + 3 + length)));
    }
  }
  return null;
}
