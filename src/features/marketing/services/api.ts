import { GlobalApiError } from '@/features/globals/services/api';
import { API_ROUTES } from '@/lib/routes/api-routes';
import type { TrackingUpdate } from '@/validations/tracking-schema';

import type { TestCapiResult, TrackingAdmin } from '../types';

const baseUrl = () => `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

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

export async function fetchTracking(): Promise<TrackingAdmin> {
  return parseOrThrow<TrackingAdmin>(await send(API_ROUTES.tracking.detail, 'GET'));
}

export async function saveTracking(input: TrackingUpdate): Promise<TrackingAdmin> {
  return parseOrThrow<TrackingAdmin>(await send(API_ROUTES.tracking.detail, 'PUT', input));
}

export async function testCapi(): Promise<TestCapiResult> {
  return parseOrThrow<TestCapiResult>(await send(API_ROUTES.tracking.testCapi, 'POST'));
}
