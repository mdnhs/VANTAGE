import { beforeEach, describe, expect, it, vi } from 'vitest';

const record = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('@/server/services/consent-service', () => ({
  CONSENT_LIMIT: { limit: 100, windowMs: 60_000 },
  recordConsent: record,
}));
vi.mock('@/server/middleware/rate-limit', () => ({
  rateLimit: () => async (_c: unknown, next: () => Promise<void>) => next(),
}));

import { publicConsent } from './public-consent';

const post = (headers: Record<string, string> = {}) =>
  publicConsent.request('/', { method: 'POST', body: '{}', headers });

beforeEach(() => record.mockClear());

describe('public consent endpoint', () => {
  it.each(['same-origin', 'same-site'])('accepts Sec-Fetch-Site %s', async (site) => {
    expect((await post({ 'sec-fetch-site': site })).status).toBe(204);
    expect(record).toHaveBeenCalledTimes(1);
  });

  it('accepts a request with no Sec-Fetch-Site (older browsers)', async () => {
    expect((await post()).status).toBe(204);
  });

  it.each(['cross-site', 'none'])('rejects Sec-Fetch-Site %s with 403', async (site) => {
    expect((await post({ 'sec-fetch-site': site })).status).toBe(403);
    expect(record).not.toHaveBeenCalled();
  });
});
