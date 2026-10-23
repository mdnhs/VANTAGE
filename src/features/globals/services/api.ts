import type { EditableGlobalKey } from '@/lib/content/global-access';
import { API_ROUTES } from '@/lib/routes/api-routes';
import type { ConflictCurrent, ErrorCode } from '@/server/lib/errors';

import type { GlobalDoc, GlobalRevisions, SavedGlobal } from '../types';

const baseUrl = () => `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

// Carries what the editor needs to react: the status (403 / 409 / 422), the
// per-field messages keyed by dotted path, and who holds the newer version.
export class GlobalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: ErrorCode,
    readonly causes?: Record<string, string[]>,
    readonly current?: ConflictCurrent,
  ) {
    super(message);
    this.name = 'GlobalApiError';
  }
}

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

const send = (path: string, method: 'GET' | 'PUT' | 'POST', json?: unknown) =>
  fetch(`${baseUrl()}${path}`, {
    method,
    credentials: 'include',
    ...(json === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) }),
  });

export async function fetchGlobal(key: EditableGlobalKey): Promise<GlobalDoc> {
  return parseOrThrow<GlobalDoc>(await send(API_ROUTES.globals.detail(key), 'GET'));
}

export async function saveGlobal(key: EditableGlobalKey, input: { version: number; value: unknown }) {
  return parseOrThrow<SavedGlobal>(await send(API_ROUTES.globals.detail(key), 'PUT', input));
}

export async function fetchGlobalRevisions(key: EditableGlobalKey): Promise<GlobalRevisions> {
  return parseOrThrow<GlobalRevisions>(await send(API_ROUTES.globals.revisions(key), 'GET'));
}

export async function restoreGlobal(key: EditableGlobalKey, revisionId: string, input: { version: number }) {
  return parseOrThrow<SavedGlobal>(await send(API_ROUTES.globals.restore(key, revisionId), 'POST', input));
}

export type TestEmailResult =
  { status: 'not_configured' } | { status: 'sent'; to: string } | { status: 'failed'; error: string };

export async function sendNotificationsTestEmail() {
  return parseOrThrow<TestEmailResult>(await send(API_ROUTES.globals.notificationsTest, 'POST'));
}
