import { errorFrom, MEDIA_URL, MediaApiError } from './services/api';
import type { MediaItem, MediaKind } from './types';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const TOO_LARGE = 'That file is over 20 MB. Choose a smaller one.';
const VIDEO_TOO_LARGE = 'That video is over 100 MB. Choose a smaller one.';
const IMAGE_ONLY = 'Upload a JPEG, PNG, WebP or AVIF image.';
const VIDEO_ONLY = 'Upload an MP4 or WebM video.';
const ANY_TYPE = 'Upload a JPEG, PNG, WebP, AVIF, PDF, MP4 or WebM file.';
const BUSY = 'The server is busy processing other uploads. Try again shortly.';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

export const ACCEPT: Record<MediaKind | 'any', string> = {
  image: IMAGE_TYPES.join(','),
  video: VIDEO_TYPES.join(','),
  any: [...IMAGE_TYPES, 'application/pdf', ...VIDEO_TYPES].join(','),
};

// A message when the server would refuse the file anyway, else null. The server
// sniffs the real bytes; this only saves a pointless upload.
export function checkFile(file: File, kind: MediaKind | 'any'): string | null {
  const known = [...IMAGE_TYPES, ...VIDEO_TYPES, 'application/pdf'];
  // A missing or generic browser type (application/octet-stream) falls back to the extension.
  const type = known.includes(file.type)
    ? file.type
    : EXTENSION_TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''] || file.type;
  const isImage = IMAGE_TYPES.includes(type);
  const isVideo = VIDEO_TYPES.includes(type);
  const isPdf = type === 'application/pdf';
  if (kind === 'image' && !isImage) return IMAGE_ONLY;
  if (kind === 'video' && !isVideo) return VIDEO_ONLY;
  if (!isImage && !isVideo && !isPdf) return ANY_TYPE;
  if (isVideo) return file.size > MAX_VIDEO_BYTES ? VIDEO_TOO_LARGE : null;
  return file.size > MAX_FILE_BYTES ? TOO_LARGE : null;
}

// fetch() has no upload progress; XMLHttpRequest does. Same origin, so the
// session cookie and Origin header come with it. `url` is the replace endpoint
// when swapping a file.
export function uploadMedia(
  file: File,
  onProgress: (pct: number) => void,
  options: { url?: string; kind?: MediaKind | 'any' } = {},
): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const refusal = checkFile(file, options.kind ?? 'any');
    if (refusal) {
      const tooLarge = refusal === TOO_LARGE || refusal === VIDEO_TOO_LARGE;
      reject(new MediaApiError(refusal, 0, tooLarge ? 'PAYLOAD_TOO_LARGE' : 'VALIDATION_ERROR'));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', options.url ?? MEDIA_URL);
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    const network = () =>
      reject(new MediaApiError("Couldn't reach the server. Check your connection and try again.", 0, 'NETWORK'));
    xhr.onload = () => {
      if (xhr.status === 0) return network();
      const body = xhr.response as { data?: MediaItem; error?: unknown } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.data) return resolve(body.data);
      const error = errorFrom(xhr.status, body as never);
      // Proxies answer 413/415/503 without our envelope; say what it means.
      if (!body?.error) {
        const plain = xhr.status === 413 ? TOO_LARGE : xhr.status === 415 ? ANY_TYPE : xhr.status === 503 ? BUSY : null;
        if (plain) {
          const code =
            xhr.status === 413
              ? 'PAYLOAD_TOO_LARGE'
              : xhr.status === 415
                ? 'UNSUPPORTED_MEDIA_TYPE'
                : 'SERVICE_UNAVAILABLE';
          return reject(new MediaApiError(plain, xhr.status, code));
        }
      }
      reject(error);
    };
    xhr.onerror = network;
    xhr.onabort = network;
    xhr.ontimeout = network;
    const form = new FormData();
    form.set('file', file);
    xhr.send(form);
  });
}
