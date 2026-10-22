import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { auditLogs, settings } from '@/server/db/schema';
import { AI_TEST_LIMIT } from '@/server/api/admin-ai';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

type Body = {
  success: boolean;
  data: {
    version: number;
    value: { enabled: boolean; allowedRoles: string[]; shareEnquiryDetails: { enabled: boolean } };
    apiKey: { hasKey: boolean; last4: string | null; readable: boolean | null };
    ok?: boolean;
    models?: string[];
    message?: string;
    available?: boolean;
    canManage?: boolean;
    provider?: string | null;
    model?: string | null;
  };
  error: { code: string; message: string; causes?: Record<string, string[]>; current?: Record<string, unknown> };
};
const json = async (res: Response) => (await res.json()) as Body;

const KEY = 'sk-test-0123456789abcd';
const settingsBody = (over: Record<string, unknown> = {}) => ({
  version: 0,
  enabled: false,
  provider: 'google',
  model: 'gemini-flash-lite-latest',
  baseUrl: '',
  allowedRoles: ['editor', 'author', 'marketer', 'intake', 'viewer'],
  systemPrompt: '',
  maxOutputTokens: 1024,
  ...over,
});
const put = (cookie: string, body: unknown) => call('/admin/ai/settings', cookie, { method: 'PUT', body });
const post = (cookie: string, path: string, body?: unknown) =>
  call(`/admin/ai/${path}`, cookie, { method: 'POST', body });

const cookies = {} as Record<RoleName, string>;
let ownerId: string;
let adminId: string;

beforeAll(async () => {
  for (const role of ROLE_NAMES) {
    const user = await createTestUser(role);
    cookies[role] = await signInCookie(user.email);
    if (role === 'owner') ownerId = user.id;
    if (role === 'admin') adminId = user.id;
  }
});

beforeEach(async () => {
  vi.stubEnv('AI_PROVIDER_MOCK', 'true');
  await db.execute(sql`truncate table settings, audit_logs, rate_limits`);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const actions = async () => (await db.select().from(auditLogs)).map((row) => row.action);

describe('status', () => {
  it('rejects anonymous callers', async () => {
    expect((await call('/admin/ai/status')).status).toBe(401);
  });

  it('status hides provider and model from a gated non-manager', async () => {
    expect(
      (await put(cookies.owner, settingsBody({ enabled: true, apiKey: KEY, allowedRoles: ['editor'] }))).status,
    ).toBe(200);
    const viewer = (await json(await call('/admin/ai/status', cookies.viewer))).data;
    expect(viewer).toEqual({
      available: false,
      canManage: false,
      provider: null,
      model: null,
      freeTierWarning: false,
    });
    const editor = (await json(await call('/admin/ai/status', cookies.editor))).data;
    expect(editor).toMatchObject({ available: true, canManage: false, provider: 'google', freeTierWarning: true });
  });

  it('shows them to owner/admin', async () => {
    for (const role of ['owner', 'admin'] as const) {
      const status = (await json(await call('/admin/ai/status', cookies[role]))).data;
      expect(status).toMatchObject({
        available: false,
        canManage: true,
        provider: 'google',
        model: 'gemini-flash-lite-latest',
      });
    }
  });
});

describe('settings access', () => {
  it('only owner and admin can read or save settings', async () => {
    for (const role of ROLE_NAMES) {
      const manager = role === 'owner' || role === 'admin';
      expect((await call('/admin/ai/settings', cookies[role])).status).toBe(manager ? 200 : 403);
    }
    expect((await put(cookies.editor, settingsBody())).status).toBe(403);
    expect((await put(cookies.viewer, settingsBody())).status).toBe(403);
    expect((await put(cookies.admin, settingsBody())).status).toBe(200);
  });
});

describe('the API key', () => {
  it('never returns or logs the key', async () => {
    const saved = await put(cookies.owner, settingsBody({ enabled: true, apiKey: KEY }));
    expect(saved.status).toBe(200);
    const savedText = await saved.text();

    const [row] = await db.select().from(settings).where(eq(settings.key, 'ai'));
    const ciphertext = (row!.value as { apiKeyEncrypted: string }).apiKeyEncrypted;
    expect(ciphertext).toMatch(/^v1\./);
    const read = await call('/admin/ai/settings', cookies.owner);
    const text = await read.text();
    for (const body of [savedText, text]) {
      expect(body).not.toContain(KEY);
      expect(body).not.toContain(ciphertext);
    }
    expect(JSON.parse(text).data.apiKey).toEqual({ hasKey: true, last4: 'abcd', readable: true });

    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, 'ai.settings_update'));
    expect(logs).toHaveLength(1);
    const diff = JSON.stringify(logs[0]!.diff);
    expect(logs[0]!.diff).toMatchObject({ apiKey: { from: 'none', to: 'replaced' } });
    expect(JSON.stringify(logs)).not.toContain(KEY);
    expect(diff).not.toContain(ciphertext);

    vi.stubEnv('AI_PROVIDER_MOCK', 'false');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ error: { message: `invalid key ${KEY} at https://x.example/v1` } }), {
          status: 401,
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const failed = await post(cookies.owner, 'settings/models', { provider: 'google' });
    const failedText = await failed.text();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new Headers(fetchMock.mock.calls[0]![1]!.headers).get('x-goog-api-key')).toBe(KEY);
    const result = (JSON.parse(failedText) as Body).data;
    expect(result.ok).toBe(false);
    expect(result.message).toContain('[hidden]');
    expect(result.message).toContain('[address]');
    expect(failedText).not.toContain(KEY);
    for (const spy of [errorSpy, warnSpy]) expect(JSON.stringify(spy.mock.calls)).not.toContain(KEY);
  });

  it('lists models with the saved key', async () => {
    await put(cookies.owner, settingsBody({ apiKey: KEY }));
    vi.stubEnv('AI_PROVIDER_MOCK', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              models: [{ name: 'models/gemini-flash-lite-latest', supportedGenerationMethods: ['generateContent'] }],
            }),
          ),
      ),
    );
    const res = await json(await post(cookies.owner, 'settings/models', { provider: 'google' }));
    expect(res.data).toEqual({ ok: true, models: ['gemini-flash-lite-latest'] });
  });

  it('saving a key without APP_ENCRYPTION_KEY is a field error on apiKey', async () => {
    vi.stubEnv('APP_ENCRYPTION_KEY', '');
    const res = await put(cookies.owner, settingsBody({ apiKey: KEY }));
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes?.apiKey?.[0]).toMatch(/APP_ENCRYPTION_KEY/);
    expect(await db.select().from(settings)).toHaveLength(0);
  });

  it('changing provider drops the stored key unless a new one is sent', async () => {
    await put(cookies.owner, settingsBody({ apiKey: KEY }));
    const switched = await put(
      cookies.owner,
      settingsBody({
        version: 1,
        provider: 'openai-compatible',
        model: 'llama',
        baseUrl: 'https://api.groq.com/openai/v1',
      }),
    );
    expect((await json(switched)).data.apiKey.hasKey).toBe(false);

    const keep = await put(
      cookies.owner,
      settingsBody({
        version: 2,
        provider: 'openai-compatible',
        model: 'llama',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: KEY,
      }),
    );
    expect((await json(keep)).data.apiKey.hasKey).toBe(true);
    const moved = await put(
      cookies.owner,
      settingsBody({
        version: 3,
        provider: 'openai-compatible',
        model: 'llama',
        baseUrl: 'https://openrouter.ai/api/v1',
      }),
    );
    expect((await json(moved)).data.apiKey.hasKey).toBe(false);

    const enabledWithout = await put(
      cookies.owner,
      settingsBody({ version: 4, enabled: true, provider: 'anthropic', model: 'claude-opus-5-5' }),
    );
    expect(enabledWithout.status).toBe(422);
    expect((await json(enabledWithout)).error.causes?.apiKey?.[0]).toMatch(/Anthropic/);
  });

  it('enabling without a key is a field error on enabled', async () => {
    const res = await put(cookies.owner, settingsBody({ enabled: true }));
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes?.enabled).toBeDefined();
  });

  it('checks the OpenAI-compatible base URL', async () => {
    const res = await put(
      cookies.owner,
      settingsBody({ provider: 'openai-compatible', model: 'm', baseUrl: 'http://example.com/v1' }),
    );
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes?.baseUrl?.[0]).toMatch(/https/);
  });

  it('strips managers from allowedRoles', async () => {
    const res = await put(cookies.owner, settingsBody({ allowedRoles: ['owner', 'admin', 'editor'] }));
    expect((await json(res)).data.value.allowedRoles).toEqual(['editor']);
  });
});

describe('versions', () => {
  it('a stale version is a 409 with updatedBy', async () => {
    expect((await put(cookies.owner, settingsBody())).status).toBe(200);
    const stale = await put(cookies.admin, settingsBody({ version: 0 }));
    expect(stale.status).toBe(409);
    const body = await json(stale);
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.current).toMatchObject({ version: 1, updatedBy: 'Test owner' });
    expect(ownerId).toBeTruthy();
  });
});

describe('enquiry sharing', () => {
  it('admin cannot change enquiry sharing; owner must acknowledge', async () => {
    const share = { enabled: true, acknowledge: true };
    expect((await put(cookies.admin, settingsBody({ shareEnquiryDetails: share }))).status).toBe(403);

    const noAck = await put(cookies.owner, settingsBody({ shareEnquiryDetails: { enabled: true } }));
    expect(noAck.status).toBe(422);
    expect((await json(noAck)).error.causes?.['shareEnquiryDetails.acknowledge']).toBeDefined();

    const done = await put(cookies.owner, settingsBody({ shareEnquiryDetails: share }));
    expect(done.status).toBe(200);
    expect((await json(done)).data.value.shareEnquiryDetails.enabled).toBe(true);
    expect(await actions()).toContain('ai.share_enquiry_details');
  });
});

describe('test connection', () => {
  it('test connection with the mock answers ok and is audited', async () => {
    await put(cookies.owner, settingsBody({ enabled: true, apiKey: KEY }));
    const res = await json(await post(cookies.owner, 'settings/test'));
    expect(res.data.ok).toBe(true);
    expect(res.data.message).toContain('Connected');
    expect(await actions()).toContain('ai.test_connection');
  });

  it('the sixth test in a minute is 429 with Retry-After', async () => {
    await put(cookies.owner, settingsBody({ enabled: true, apiKey: KEY }));
    for (let i = 0; i < AI_TEST_LIMIT.limit; i++) {
      expect((await post(cookies.owner, 'settings/test')).status).toBe(200);
    }
    const sixth = await post(cookies.owner, 'settings/test');
    expect(sixth.status).toBe(429);
    expect(sixth.headers.get('retry-after')).toBeTruthy();
  });

  it('a provider failure comes back without the key', async () => {
    await put(cookies.owner, settingsBody({ enabled: true, apiKey: KEY }));
    vi.stubEnv('AI_PROVIDER_MOCK', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { message: `bad ${KEY}` } }), { status: 400 })),
    );
    const res = await json(await post(cookies.owner, 'settings/test'));
    expect(res.data.ok).toBe(false);
    expect(res.data.message).not.toContain(KEY);
  });
});

describe('view-as', () => {
  it('writes are refused while viewing as someone', async () => {
    const viewing = await viewAsCookie(cookies.owner, adminId);
    for (const res of [
      await put(viewing, settingsBody()),
      await post(viewing, 'settings/test'),
      await post(viewing, 'settings/models', { provider: 'google' }),
    ]) {
      expect(res.status).toBe(403);
      expect((await json(res)).error.code).toBe('IMPERSONATION_READ_ONLY');
    }
    expect(await db.select().from(settings)).toHaveLength(0);
  });
});
