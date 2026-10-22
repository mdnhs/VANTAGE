import 'server-only';

import { createHmac } from 'node:crypto';

import { serverEnv } from '@/lib/env';

// Keyed hash: enough to spot repeated abuse, impossible to reverse into an
// address without the server secret.
export function hashIp(ip: string): string {
  return createHmac('sha256', serverEnv().AUTH_SECRET).update(ip).digest('hex').slice(0, 32);
}

// Domain-separated keys from the one server secret.
export function derivedHmac(label: string, value: string): string {
  const key = createHmac('sha256', serverEnv().AUTH_SECRET).update(label).digest();
  return createHmac('sha256', key).update(value).digest('hex');
}
