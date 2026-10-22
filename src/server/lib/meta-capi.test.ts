import { describe, expect, it, vi } from 'vitest';

import { buildLeadEvent, capiAllowedPath, sendCapi, sha256 } from './meta-capi';

const input = {
  leadId: '7d0c2f1a-0000-4000-8000-000000000001',
  eventId: '0b5f3c1e-1d2a-4c8b-9e7f-123456789abc',
  eventTime: new Date('2026-10-10T12:00:00Z'),
  sourcePath: '/contact?topic=repair#form',
  siteUrl: 'https://vantageautobody.ie',
  ip: '203.0.113.9',
  userAgent: 'Mozilla/5.0',
  fbp: 'fb.1.1700000000000.123456789',
  fbc: 'fb.1.1700000000000.IwAR0abc',
  email: 'Ann@Example.com ',
  phone: '+353871234567',
  enhancedMatching: false,
};

describe('buildLeadEvent', () => {
  it('the default payload has no email, phone or query-bearing URL', () => {
    const event = buildLeadEvent(input);
    expect(event).toEqual({
      event_name: 'Lead',
      event_time: 1791633600,
      event_id: input.eventId,
      action_source: 'website',
      event_source_url: 'https://vantageautobody.ie/contact',
      user_data: {
        client_ip_address: '203.0.113.9',
        client_user_agent: 'Mozilla/5.0',
        fbp: input.fbp,
        fbc: input.fbc,
        external_id: [sha256(input.leadId)],
      },
    });
    const json = JSON.stringify(event);
    for (const leak of [
      'ann@example.com',
      'Ann@Example.com',
      '353871234567',
      sha256('ann@example.com'),
      sha256('353871234567'),
      'topic',
      '?',
      '#',
      'custom_data',
      '"em"',
      '"ph"',
    ])
      expect(json).not.toContain(leak);
  });

  it('sends an unlisted page as the site root and keeps allowlisted routes', () => {
    expect(buildLeadEvent({ ...input, sourcePath: '/landing-page-slug' }).event_source_url).toBe(
      'https://vantageautobody.ie/',
    );
    expect(buildLeadEvent({ ...input, sourcePath: '/get-a-quote?utm_source=x' }).event_source_url).toBe(
      'https://vantageautobody.ie/get-a-quote',
    );
  });

  it('drops malformed fbp/fbc and a missing IP', () => {
    const event = buildLeadEvent({ ...input, fbp: '<script>', fbc: undefined, ip: null });
    expect(event.user_data).toEqual({ client_user_agent: 'Mozilla/5.0', external_id: [sha256(input.leadId)] });
  });

  it('adds trimmed, lower-cased, hashed em and digits-only ph only with enhanced matching', () => {
    const event = buildLeadEvent({ ...input, enhancedMatching: true });
    expect(event.user_data.em).toEqual([sha256('ann@example.com')]);
    expect(event.user_data.ph).toEqual([sha256('353871234567')]);
  });
});

describe('sendCapi', () => {
  const ok = () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  const err = (status: number, message = 'Invalid parameter') =>
    new Response(JSON.stringify({ error: { message } }), { status });
  const event = buildLeadEvent(input);

  it('posts to v26.0 with the token in the body, not the URL', async () => {
    const fetchImpl = vi.fn(async () => ok());
    const result = await sendCapi({
      pixelId: '1234567890',
      token: 'EAAB-secret',
      events: [event],
      fetchImpl: fetchImpl as never,
    });
    expect(result).toEqual({ ok: true, status: 200 });
    const [url, init] = fetchImpl.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v26.0/1234567890/events');
    expect(url).not.toContain('EAAB');
    expect(JSON.parse(String(init.body))).toEqual({ data: [event], access_token: 'EAAB-secret' });
  });

  it('adds test_event_code when given', async () => {
    const fetchImpl = vi.fn(async () => ok());
    await sendCapi({
      pixelId: '1234567890',
      token: 't',
      events: [event],
      testEventCode: 'TEST123',
      fetchImpl: fetchImpl as never,
    });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(String(init.body)).test_event_code).toBe('TEST123');
  });

  it('retries 500, 429 and network errors with backoff, then succeeds', async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(err(500))
      .mockResolvedValueOnce(err(429))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(ok());
    const result = await sendCapi({
      pixelId: '1234567890',
      token: 't',
      events: [event],
      fetchImpl,
      sleep,
      delays: [0, 1000, 4000, 4000],
    });
    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls).toEqual([[1000], [4000], [4000]]);
  });

  it('gives up after the last attempt and reports the last failure', async () => {
    const fetchImpl = vi.fn(async () => err(503, 'down'));
    const result = await sendCapi({
      pixelId: '1234567890',
      token: 't',
      events: [event],
      fetchImpl: fetchImpl as never,
      sleep: async () => undefined,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ ok: false, status: 503, message: 'down' });
  });

  it('stops at once on a 400 and never echoes the token', async () => {
    const fetchImpl = vi.fn(async () => err(400, 'Invalid OAuth access token: EAAB-secret'));
    const result = await sendCapi({
      pixelId: '1234567890',
      token: 'EAAB-secret',
      events: [event],
      fetchImpl: fetchImpl as never,
      sleep: async () => undefined,
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: false, status: 400, message: 'Invalid OAuth access token: [token]' });
  });

  it('reports a network failure without throwing', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const result = await sendCapi({
      pixelId: '1234567890',
      token: 't',
      events: [event],
      fetchImpl,
      sleep: async () => undefined,
    });
    expect(result).toEqual({ ok: false, status: 0, message: 'Meta could not be reached' });
  });
});

describe('sendCapi hardening', () => {
  const event = buildLeadEvent(input);

  it('does not follow redirects: they are failures', async () => {
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      expect(init?.redirect).toBe('error');
      throw new TypeError('redirect mode is set to error');
    });
    const result = await sendCapi({
      pixelId: '1234567890',
      token: 'EAAB-secret',
      events: [event],
      fetchImpl: fetchImpl as never,
      sleep: async () => undefined,
    });
    expect(result).toEqual({ ok: false, status: 0, message: 'Meta could not be reached' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('treats a 307 response as a failure without reading a Location', async () => {
    const res = new Response(null, { status: 307, headers: { location: 'https://evil.example/' } });
    const result = await sendCapi({
      pixelId: '1234567890',
      token: 't',
      events: [event],
      fetchImpl: vi.fn(async () => res) as never,
    });
    expect(result).toEqual({ ok: false, status: 307, message: 'HTTP 307' });
  });

  it('reads only a bounded error body and survives non-JSON', async () => {
    const huge = new Response('x'.repeat(5_000_000), { status: 400 });
    const html = new Response('<html>nope</html>', { status: 400 });
    const big = JSON.stringify({ error: { message: 'm'.repeat(10_000) } });
    for (const [res, message] of [
      [huge, 'HTTP 400'],
      [html, 'HTTP 400'],
    ] as const) {
      const result = await sendCapi({
        pixelId: '1234567890',
        token: 't',
        events: [event],
        fetchImpl: vi.fn(async () => res) as never,
      });
      expect(result).toEqual({ ok: false, status: 400, message });
    }
    const long = await sendCapi({
      pixelId: '1234567890',
      token: 't',
      events: [event],
      fetchImpl: vi.fn(async () => new Response(big, { status: 400 })) as never,
    });
    // Cut off at 4 KB the JSON is no longer valid: no message, no crash.
    expect(long).toEqual({ ok: false, status: 400, message: 'HTTP 400' });
  });
});

describe('capiAllowedPath', () => {
  it('needs a single leading slash and a parseable path', () => {
    for (const path of ['/contact', '/services/x?x=1', '/']) expect(capiAllowedPath(path), path).toBe(true);
    for (const path of ['//evil.example', '\\\\x', 'contact', 'https://evil.example/', '']) {
      expect(capiAllowedPath(path), path).toBe(false);
    }
  });
});
