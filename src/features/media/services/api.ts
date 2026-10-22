import type { MediaItem, MediaListParams, MediaPage, MediaUse } from '../types';

export const MEDIA_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}/admin/media`;

export const PAGE_SIZE = 40;

// Carries the server's code, per-field messages (422 `causes`) and structured
// `details` (the usage list of a 409).
export class MediaApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly code?: string,
    readonly causes: Record<string, string[]> = {},
    readonly details?: unknown,
  ) {
    super(message);
  }

  get usage(): MediaUse[] {
    const usage = (this.details as { usage?: MediaUse[] } | undefined)?.usage;
    return Array.isArray(usage) ? usage : [];
  }
}

type Envelope = {
  success?: boolean;
  data?: unknown;
  pagination?: { hasNextPage?: boolean };
  error?: { code?: string; message?: string; causes?: Record<string, string[]>; details?: unknown };
};

export function errorFrom(status: number, body: Envelope | null): MediaApiError {
  const error = body?.error;
  return new MediaApiError(error?.message ?? 'Request failed', status, error?.code, error?.causes, error?.details);
}

async function parse(res: Response): Promise<Envelope> {
  const body = (await res.json().catch(() => null)) as Envelope | null;
  if (!res.ok || !body?.success) throw errorFrom(res.status, body);
  return body;
}

const send = (path: string, method: string, body?: unknown) =>
  fetch(`${MEDIA_URL}${path}`, {
    method,
    credentials: 'include',
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });

export async function fetchMediaPage(params: MediaListParams, page: number): Promise<MediaPage> {
  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (params.q) query.set('q', params.q);
  if (params.type) query.set('type', params.type);
  if (params.missingAlt) query.set('missingAlt', 'true');
  if (params.ids?.length) query.set('ids', params.ids.join(','));
  const body = await parse(await fetch(`${MEDIA_URL}?${query.toString()}`, { credentials: 'include' }));
  return { items: body.data as MediaItem[], hasNextPage: Boolean(body.pagination?.hasNextPage) };
}

export async function fetchMediaUsage(id: string): Promise<MediaUse[]> {
  return (await parse(await send(`/${id}/usage`, 'GET'))).data as MediaUse[];
}

export type MediaDetailsPatch = {
  alt?: string;
  caption?: string | null;
  focalX?: number;
  focalY?: number;
  isDecorative?: boolean;
};

export async function patchMedia(id: string, patch: MediaDetailsPatch): Promise<MediaItem> {
  return (await parse(await send(`/${id}`, 'PATCH', patch))).data as MediaItem;
}

export async function deleteMedia(id: string): Promise<void> {
  await parse(await send(`/${id}`, 'DELETE'));
}
