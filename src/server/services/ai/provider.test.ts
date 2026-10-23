import dns from 'node:dns';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildModel, getModel, localHttpAllowed, mockEnabled } from './provider';

afterEach(() => {
  vi.unstubAllEnvs();
});

const key = 'test-key-0123456789';
const info = (m: unknown) => m as { provider: string; modelId: string };

describe('buildModel', () => {
  it("builds each provider's model without calling it", () => {
    const g = buildModel({ provider: 'google', model: 'gemini-flash-latest', baseUrl: '', apiKey: key });
    expect([info(g).provider, info(g).modelId]).toEqual(['google.generative-ai', 'gemini-flash-latest']);
    const a = buildModel({ provider: 'anthropic', model: 'claude-opus-5-5', baseUrl: '', apiKey: key });
    expect([info(a).provider, info(a).modelId]).toEqual(['anthropic.messages', 'claude-opus-5-5']);
    const o = buildModel({
      provider: 'openai-compatible',
      model: 'llama',
      baseUrl: 'https://api.groq.com/openai/v1/',
      apiKey: null,
    });
    expect([info(o).provider, info(o).modelId]).toEqual(['custom.chat', 'llama']);
  });

  it('needs a key for Google and Anthropic', () => {
    for (const provider of ['google', 'anthropic'] as const) {
      expect(() => buildModel({ provider, model: 'm', baseUrl: '', apiKey: null })).toThrow(/isn't set up/);
    }
  });

  it('refuses a bad base URL', () => {
    expect(() =>
      buildModel({ provider: 'openai-compatible', model: 'm', baseUrl: 'http://example.com', apiKey: null }),
    ).toThrow(/Validation failed/);
  });
});

describe('redirects (MK R6)', () => {
  it.each([
    { provider: 'google', baseUrl: '' },
    { provider: 'anthropic', baseUrl: '' },
  ] as const)('$provider requests refuse redirects', async (s) => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }));
    const model = buildModel({ ...s, model: 'm', apiKey: key }) as unknown as {
      doGenerate: (o: unknown) => Promise<unknown>;
    };
    await model
      .doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] })
      .catch(() => undefined);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]![1]!.redirect).toBe('error');
    spy.mockRestore();
  });

  it('openai-compatible requests use the address-guarded fetch, not the global one', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const lookup = vi.spyOn(dns, 'lookup').mockImplementation(((_h: string, _o: unknown, cb: unknown) => {
      (cb as (e: null, a: { address: string; family: number }[]) => void)(null, [{ address: '10.0.0.5', family: 4 }]);
    }) as unknown as typeof dns.lookup);
    const model = buildModel({
      provider: 'openai-compatible',
      model: 'm',
      baseUrl: 'https://rebind.example/v1',
      apiKey: key,
    }) as unknown as { doGenerate: (o: unknown) => Promise<unknown> };
    const error = await model
      .doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] })
      .catch((e: unknown) => e);
    expect(String((error as Error).message)).toContain('That address points to a private network');
    expect(spy).not.toHaveBeenCalled();
    lookup.mockRestore();
    spy.mockRestore();
  });
});

describe('the mock provider (V9-R6)', () => {
  it('is used when the flag is on outside production', async () => {
    vi.stubEnv('AI_PROVIDER_MOCK', 'true');
    expect(mockEnabled()).toBe(true);
    const model = await getModel({ provider: 'google', model: 'gemini-flash-latest', baseUrl: '', apiKey: null });
    expect(info(model).provider).toBe('mock');
  });

  it('is off by default', () => {
    expect(mockEnabled()).toBe(false);
  });

  it('mockEnabled is false when NODE_ENV is production even if AI_PROVIDER_MOCK is true', () => {
    vi.stubEnv('AI_PROVIDER_MOCK', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    expect(mockEnabled()).toBe(false);
  });

  it('allows plain http localhost only in development', () => {
    expect(localHttpAllowed()).toBe(false);
    vi.stubEnv('NODE_ENV', 'development');
    expect(localHttpAllowed()).toBe(true);
  });
});
