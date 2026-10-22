import 'server-only';

import { createHash } from 'node:crypto';

import sharp from 'sharp';

import { serverEnv } from '@/lib/env';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';

import { probeImage } from './probe';
import { sniff, type Sniffed } from './sniff';
import { buildMediaKey } from './storage';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_EDGE = 4000;
// Decompression-bomb guard: a small file can declare a huge canvas. 50 MP
// covers phone and most camera photos (a 50 MP decode is ~150 MB); sharp
// refuses anything larger before decoding the pixels.
const MAX_INPUT_PIXELS = 50_000_000;

// At most two images decode at once per process, with a short queue behind
// them; past that the upload is refused (503) rather than queued without
// bound, so a burst of uploads cannot exhaust memory.
const MAX_RUNNING = 2;
const MAX_WAITING = 8;
let running = 0;
const waiting: (() => void)[] = [];

export async function withProcessingSlot<T>(work: () => Promise<T>): Promise<T> {
  if (running >= MAX_RUNNING) {
    if (waiting.length >= MAX_WAITING) {
      throw ApiError.serviceUnavailable('The server is busy processing uploads — try again in a moment');
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    running++;
  }
  try {
    return await work();
  } finally {
    // Hand the slot straight to the next waiter, or free it.
    const next = waiting.shift();
    if (next) next();
    else running--;
  }
}

// What sharp reports for each allowed image type. A file whose magic bytes and
// decoded format disagree is refused.
const SHARP_FORMAT = {
  jpg: 'jpeg',
  png: 'png',
  webp: 'webp',
  avif: 'heif',
} as const;

export type ProcessedUpload = {
  body: Buffer;
  key: string;
  mimeType: Sniffed['mime'];
  sizeBytes: number;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  dominantColor: string | null;
};

const validation = (message: string) => new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 422, { file: [message] });

const unreadable = () => validation('That image could not be read');

// autoOrient bakes the EXIF rotation into the pixels; sharp writes no
// metadata unless asked, so EXIF (GPS included), XMP and IPTC go here. The
// re-encode also drops anything appended to or hidden in the original bytes.
async function normalise(input: Buffer, type: Sniffed) {
  const options = { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS } as const;
  if (type.ext === 'pdf' || type.ext === 'mp4' || type.ext === 'webm') {
    throw new Error(`normalise: ${type.ext} is not an image`);
  }
  const { format } = await sharp(input, options).metadata();
  if (format !== SHARP_FORMAT[type.ext]) throw unreadable();
  const image = sharp(input, options).autoOrient().resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  });
  switch (type.ext) {
    case 'jpg':
      return image.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    case 'png':
      return image.png({ compressionLevel: 9 }).toBuffer();
    case 'webp':
      return image.webp({ quality: 88 }).toBuffer();
    case 'avif':
      return image.avif({ quality: 60 }).toBuffer();
  }
}

const slugify = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// The client's filename is only a label: keep the last path segment and drop
// control characters, so it never reads as a path anywhere it is shown.
export function cleanFilename(name: string) {
  const base = name.split(/[\\/]/).pop() ?? '';
  return (
    base

      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 200) || 'file'
  );
}

export async function processUpload(input: Buffer, filename: string, now = new Date()): Promise<ProcessedUpload> {
  const type = sniff(input);
  if (!type) {
    throw ApiError.unsupportedMediaType('Upload a JPEG, PNG, WebP, AVIF, PDF, MP4 or WebM file');
  }
  const isVideo = type.ext === 'mp4' || type.ext === 'webm';
  if (input.length > (isVideo ? MAX_VIDEO_BYTES : MAX_UPLOAD_BYTES)) {
    throw ApiError.payloadTooLarge(isVideo ? 'Videos can be up to 100 MB' : 'Files can be up to 20 MB');
  }
  const noProbe = {
    width: null as number | null,
    height: null as number | null,
    blurDataUrl: null as string | null,
    dominantColor: null as string | null,
  };
  let body: Buffer;
  let probe: typeof noProbe;
  let hash: string;
  try {
    // Every type holds a slot, so concurrent large uploads (a 100 MB video is
    // hashed here) are bounded too. Content-hashed and immutable: a replace
    // gets a new key.
    ({ body, probe, hash } = await withProcessingSlot(async () => {
      const isImage = !isVideo && type.ext !== 'pdf';
      const out = isImage ? await normalise(input, type) : input;
      return {
        body: out,
        probe: isImage ? await probeImage(out) : noProbe,
        hash: createHash('sha256').update(out).digest('hex').slice(0, 16),
      };
    }));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw unreadable();
  }
  const slug =
    slugify(cleanFilename(filename).replace(/\.[^.]*$/, ''))
      .slice(0, 60)
      .replace(/-$/, '') || 'file';
  return {
    body,
    key: buildMediaKey(serverEnv().MEDIA_KEY_PREFIX, now, hash, slug, type.ext),
    mimeType: type.mime,
    sizeBytes: body.length,
    ...probe,
  };
}
