import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';

import { serverEnv } from '@/lib/env';
import { contentDisposition, localFile } from '@/server/lib/media/storage';

const NOT_FOUND = () =>
  new Response('Not found', {
    status: 404,
    headers: { 'X-Content-Type-Options': 'nosniff' },
  });

type ByteRange = { start: number; end: number } | 'unsatisfiable' | null;

// One `bytes=a-b`, `bytes=a-` or `bytes=-n` range. Anything else (other units, several ranges,
// malformed) is ignored and the whole file is sent, as the spec allows.
function parseRange(header: string | null, size: number): ByteRange {
  const match = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!match || (match[1] === '' && match[2] === '')) return null;
  let start: number;
  let end: number;
  if (match[1] === '') {
    const suffix = Number(match[2]);
    if (suffix === 0) return 'unsatisfiable';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
    if (match[2] !== '' && Number(match[2]) < start) return null;
  }
  return start >= size ? 'unsatisfiable' : { start, end };
}

// Serves the `local` driver. Only keys matching the media key pattern resolve
// (no traversal, no listing), and the type comes from the key's extension, set
// at upload from the sniffed bytes. Keys are content-hashed, so responses are
// immutable. The CSP sandbox keeps a crafted file inert, and PDFs download
// instead of opening in a sandboxed viewer. Files stream from disk and honour a
// single Range (206 / 416), which Safari needs for <video>.
export async function GET(request: Request, ctx: RouteContext<'/uploads/[...key]'>) {
  if (serverEnv().MEDIA_DRIVER === 's3') return NOT_FOUND();
  const { key } = await ctx.params;
  const name = key.join('/');
  const file = localFile(name);
  if (!file) return NOT_FOUND();
  let size: number;
  try {
    const info = await stat(file.path);
    if (!info.isFile()) return NOT_FOUND();
    size = info.size;
  } catch {
    return NOT_FOUND();
  }
  const headers: Record<string, string> = {
    'Content-Type': file.mimeType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cross-Origin-Resource-Policy': 'same-site',
    ...(file.mimeType === 'application/pdf' && { 'Content-Disposition': contentDisposition(name)! }),
  };
  const range = parseRange(request.headers.get('range'), size);
  if (range === 'unsatisfiable') {
    return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } });
  }
  const start = range?.start ?? 0;
  const end = range?.end ?? size - 1;
  if (size === 0) return new Response(null, { headers: { ...headers, 'Content-Length': '0' } });
  const stream = Readable.toWeb(createReadStream(file.path, { start, end })) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    status: range ? 206 : 200,
    headers: {
      ...headers,
      'Content-Length': String(end - start + 1),
      ...(range && { 'Content-Range': `bytes ${start}-${end}/${size}` }),
    },
  });
}
