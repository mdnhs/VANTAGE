import { API_ROUTES } from '@/lib/routes/api-routes';
import type { ConflictCurrent, ErrorCode } from '@/server/lib/errors';

import type { AiAdmin, AiSettingsUpdate, AiStatus, ListModelsInput, ListModelsResult } from '../types';

const baseUrl = () => `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

// Carries what the screen needs to react: the status (403 / 409 / 422 / 429), the
// per-field messages keyed by dotted path, and who holds the newer version.
export class AiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: ErrorCode,
    readonly causes?: Record<string, string[]>,
    readonly current?: ConflictCurrent,
  ) {
    super(message);
    this.name = 'AiApiError';
  }
}

export async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const error = body?.error;
    throw new AiApiError(error?.message ?? 'Request failed', res.status, error?.code, error?.causes, error?.current);
  }
  return body.data as T;
}

export const send = (path: string, method: 'GET' | 'PUT' | 'POST' | 'DELETE', json?: unknown) =>
  fetch(`${baseUrl()}${path}`, {
    method,
    credentials: 'include',
    ...(json === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) }),
  });

export const aiApi = {
  async status(): Promise<AiStatus> {
    return parseOrThrow<AiStatus>(await send(API_ROUTES.ai.status, 'GET'));
  },
  async getSettings(): Promise<AiAdmin> {
    return parseOrThrow<AiAdmin>(await send(API_ROUTES.ai.settings, 'GET'));
  },
  async saveSettings(input: AiSettingsUpdate): Promise<AiAdmin> {
    return parseOrThrow<AiAdmin>(await send(API_ROUTES.ai.settings, 'PUT', input));
  },
  async listModels(input: ListModelsInput): Promise<ListModelsResult> {
    return parseOrThrow<ListModelsResult>(await send(API_ROUTES.ai.models, 'POST', input));
  },
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return parseOrThrow<{ ok: boolean; message: string }>(await send(API_ROUTES.ai.test, 'POST'));
  },
};
