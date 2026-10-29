import type { PresetId } from '@/lib/theme/presets';
import type { ThemeConfigValue } from '@/lib/theme/schema';
import { API_ROUTES } from '@/lib/routes/api-routes';
import { GlobalApiError } from '@/features/globals/services/api';

import type { ThemeAdminDoc, ThemeResetScope, ThemeRevision } from '../types';

const baseUrl = () => `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}`;

export { exitPreviewHref, previewHref } from '@/lib/routes/preview-href';

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const error = body?.error;
    throw new GlobalApiError(
      error?.message ?? 'Request failed',
      res.status,
      error?.code,
      error?.causes,
      error?.current,
    );
  }
  return body.data as T;
}

const send = (path: string, method: 'GET' | 'PUT' | 'POST', json?: unknown, init?: RequestInit) =>
  fetch(`${baseUrl()}${path}`, {
    method,
    credentials: 'include',
    ...(json === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) }),
    ...init,
  });

export async function fetchTheme(): Promise<ThemeAdminDoc> {
  return parseOrThrow(await send(API_ROUTES.theme.detail, 'GET'));
}

export async function fetchThemeRevisions(): Promise<{ items: ThemeRevision[] }> {
  return parseOrThrow(await send(API_ROUTES.theme.revisions, 'GET'));
}

export async function saveThemeDraft(
  input: { version: number; draft: ThemeConfigValue },
  options?: { keepalive?: boolean },
): Promise<ThemeAdminDoc> {
  return parseOrThrow(
    await send(API_ROUTES.theme.draft, 'PUT', input, options?.keepalive ? { keepalive: true } : undefined),
  );
}

export async function publishTheme(input: { version: number }): Promise<ThemeAdminDoc> {
  return parseOrThrow(await send(API_ROUTES.theme.publish, 'POST', input));
}

export async function resetTheme(input: {
  version: number;
  preset: PresetId;
  scope: ThemeResetScope;
}): Promise<ThemeAdminDoc> {
  return parseOrThrow(await send(API_ROUTES.theme.reset, 'POST', input));
}

export async function discardTheme(input: { version: number }): Promise<ThemeAdminDoc> {
  return parseOrThrow(await send(API_ROUTES.theme.discard, 'POST', input));
}

export async function restoreTheme(revisionId: string, input: { version: number }): Promise<ThemeAdminDoc> {
  return parseOrThrow(await send(API_ROUTES.theme.restore(revisionId), 'POST', input));
}
