import { API_ROUTES } from '@/lib/routes/api-routes';
import type { RedirectDto, RedirectInput, RedirectPatch } from '@/lib/seo/redirect-rules';

const baseUrl = () => `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

// Carries the server's per-field messages (422 / 409 `causes`).
export class RedirectsApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly causes: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'RedirectsApiError';
  }
}

type Envelope = {
  success?: boolean;
  data?: unknown;
  pagination?: { total?: number };
  error?: { message?: string; causes?: Record<string, string[]> };
};

async function parse(res: Response): Promise<Envelope> {
  const body = (await res.json().catch(() => null)) as Envelope | null;
  if (!res.ok || !body?.success) {
    throw new RedirectsApiError(body?.error?.message ?? 'Request failed', res.status, body?.error?.causes);
  }
  return body;
}

const send = (path: string, method: 'POST' | 'PATCH' | 'DELETE', json?: unknown) =>
  fetch(`${baseUrl()}${path}`, {
    method,
    credentials: 'include',
    ...(json === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) }),
  });

export type RedirectListParams = { q?: string; page: number; limit: number };
export type RedirectList = { items: RedirectDto[]; total: number };

export async function fetchRedirects(params: RedirectListParams): Promise<RedirectList> {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
  if (params.q) query.set('q', params.q);
  const body = await parse(
    await fetch(`${baseUrl()}${API_ROUTES.redirects.list}?${query.toString()}`, { credentials: 'include' }),
  );
  const items = body.data as RedirectDto[];
  return { items, total: body.pagination?.total ?? items.length };
}

export async function createRedirect(input: Omit<RedirectInput, 'note'> & { note?: string }): Promise<RedirectDto> {
  return (await parse(await send(API_ROUTES.redirects.list, 'POST', input))).data as RedirectDto;
}

export async function patchRedirect(id: string, patch: RedirectPatch): Promise<RedirectDto> {
  return (await parse(await send(API_ROUTES.redirects.detail(id), 'PATCH', patch))).data as RedirectDto;
}

export async function deleteRedirect(id: string): Promise<void> {
  await parse(await send(API_ROUTES.redirects.detail(id), 'DELETE'));
}
