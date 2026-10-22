// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActorProvider } from '@/contexts/actor-provider';
import type { MePayload } from '@/lib/auth/me';

import { toast } from 'sonner';

import { CONFLICT_NOTICE, SettingsView } from './settings-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/auth/hooks/use-me', () => ({ useMe: (actor: MePayload) => ({ data: actor }) }));

const doc = (over: Record<string, unknown> = {}, version = 3) => ({
  version,
  value: {
    enabled: false,
    provider: 'google',
    model: 'gemini-flash-lite-latest',
    baseUrl: '',
    allowedRoles: ['editor', 'author', 'marketer', 'intake', 'viewer'],
    shareEnquiryDetails: { enabled: false, acknowledgedAt: null, acknowledgedBy: null },
    systemPrompt: '',
    maxOutputTokens: 1024,
    ...over,
  },
  apiKey: { hasKey: true, last4: 'WXYZ', readable: true },
  keyAvailable: true,
  localHttpAllowed: false,
  mock: false,
});
const ok = (data: unknown) => ({ status: 200, body: { success: true, data } });

const owner: MePayload = {
  user: { id: 'o', email: 'o@x.ie', name: 'Olive' },
  roles: ['owner'],
  permissions: { ai: ['use', 'manage'] },
  twoFactorEnabled: true,
  impersonatedBy: null,
};
const admin: MePayload = { ...owner, roles: ['admin'] };
const editor: MePayload = { ...owner, roles: ['editor'], permissions: { ai: ['use'] } };

type Call = { method: string; path: string; body: Record<string, unknown> | null };
let calls: Call[];
let gets: ReturnType<typeof ok>[];
let responses: Record<string, { status: number; body: unknown }>;

beforeEach(() => {
  calls = [];
  gets = [ok(doc())];
  responses = {};
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const path = url.replace('/api/v1', '');
    calls.push({ method, path, body: init.body ? JSON.parse(init.body as string) : null });
    const res =
      method === 'GET' && path === '/admin/ai/settings'
        ? gets.length > 1
          ? gets.shift()!
          : gets[0]!
        : (responses[`${method} ${path}`] ?? ok({}));
    return Promise.resolve(new Response(JSON.stringify(res.body), { status: res.status }));
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

let queryClient: QueryClient;
function setup(actor = owner) {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ActorProvider actor={actor}>
        <SettingsView />
      </ActorProvider>
    </QueryClientProvider>,
  );
}

const puts = () => calls.filter((c) => c.method === 'PUT');

describe('SettingsView', () => {
  it('never prefills the key and shows only its last 4', async () => {
    setup();
    expect(await screen.findByText(/ending ••••WXYZ/)).toBeTruthy();
    expect(screen.queryByDisplayValue(/WXYZ/)).toBeNull();
  });

  it('warns about the free Gemini tier only for Google, and suggests the default model on change', async () => {
    setup();
    expect(await screen.findByText(/Don't paste client details/)).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Anthropic Claude' }));
    expect(screen.queryByText(/Don't paste client details/)).toBeNull();
    expect((screen.getByLabelText('Model') as HTMLInputElement).value).toBe('claude-opus-5-5');
  });

  it('asks for a base URL for OpenAI-compatible providers and checks it', async () => {
    setup();
    fireEvent.click(await screen.findByRole('radio', { name: 'OpenAI-compatible' }));
    const url = screen.getByLabelText('Base URL');
    fireEvent.change(url, { target: { value: 'http://example.com/v1' } });
    fireEvent.blur(url);
    expect(await screen.findByText(/https/)).toBeTruthy();
  });

  it('fills the model picker from List models', async () => {
    responses['POST /admin/ai/settings/models'] = ok({ ok: true, models: ['a-model', 'b-model'] });
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'List models' }));
    await waitFor(() => expect(document.querySelectorAll('datalist option')).toHaveLength(2));
  });

  it('shows enabling without a key as a field error', async () => {
    gets = [ok({ ...doc(), apiKey: { hasKey: false, last4: null, readable: null } })];
    responses['PUT /admin/ai/settings'] = {
      status: 422,
      body: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          causes: { enabled: ['Add an API key before turning the assistant on'] },
        },
      },
    };
    setup();
    fireEvent.click(await screen.findByRole('switch', { name: 'Turn on the AI assistant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Add an API key before turning the assistant on')).toBeTruthy();
  });

  it('lets only an owner share enquiry details; an admin sees it disabled', async () => {
    setup(admin);
    const toggle = await screen.findByRole('switch', { name: /enquiry details/ });
    expect(toggle.hasAttribute('data-disabled')).toBe(true);
    expect(screen.getByText('Only an owner can change this.')).toBeTruthy();
  });

  it('makes the owner tick the acknowledgement, which names the 90-day retention', async () => {
    responses['PUT /admin/ai/settings'] = ok(doc());
    setup();
    fireEvent.click(await screen.findByRole('switch', { name: /enquiry details/ }));
    const ack = screen.getByRole('checkbox', { name: /kept for up to 90 days/ });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0]!.body).toMatchObject({ shareEnquiryDetails: { enabled: true, acknowledge: false } });
    fireEvent.click(ack);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(puts()).toHaveLength(2));
    expect(puts()[1]!.body).toMatchObject({ shareEnquiryDetails: { enabled: true, acknowledge: true } });
  });

  it('omits the key when the field is blank, sends it when typed, and sends null on Remove key', async () => {
    responses['PUT /admin/ai/settings'] = ok(doc());
    setup();
    fireEvent.click(await screen.findByRole('switch', { name: 'Turn on the AI assistant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0]!.body).toMatchObject({ version: 3, enabled: true, provider: 'google' });
    expect(puts()[0]!.body).not.toHaveProperty('apiKey');

    fireEvent.click(await screen.findByRole('button', { name: 'Remove key' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(puts()).toHaveLength(2));
    expect(puts()[1]!.body).toHaveProperty('apiKey', null);
  });

  it('sends a typed replacement key and keeps it out of every cache', async () => {
    const KEY = 'sk-new-0123456789';
    responses['PUT /admin/ai/settings'] = ok(doc());
    responses['POST /admin/ai/settings/models'] = ok({ ok: true, models: ['m'] });
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Replace key' }));
    fireEvent.change(screen.getByLabelText('API key'), { target: { value: KEY } });
    fireEvent.click(screen.getByRole('button', { name: 'List models' }));
    await waitFor(() => expect(document.querySelectorAll('datalist option')).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0]!.body).toHaveProperty('apiKey', KEY);
    expect(calls.find((c) => c.path.endsWith('/models'))!.body).toHaveProperty('apiKey', KEY);
    await waitFor(() => expect(queryClient.getMutationCache().getAll()).toHaveLength(0));
    const held = JSON.stringify([
      queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.state),
      queryClient
        .getMutationCache()
        .getAll()
        .map((m) => m.state),
    ]);
    expect(held).not.toContain(KEY);
  });

  it('shows a rate-limited Test connection as an error', async () => {
    responses['POST /admin/ai/settings/test'] = {
      status: 429,
      body: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Wait a moment and try again.' },
      },
    };
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Test connection' }));
    expect((await screen.findByRole('status')).textContent).toBe('Too many requests. Wait a moment and try again.');
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Too many requests. Wait a moment and try again.');
  });

  it('shows a server-rejected acknowledgement inline', async () => {
    responses['PUT /admin/ai/settings'] = {
      status: 422,
      body: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          causes: { 'shareEnquiryDetails.acknowledge': ['Confirm the acknowledgement first'] },
        },
      },
    };
    setup();
    fireEvent.click(await screen.findByRole('switch', { name: /enquiry details/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const message = await screen.findByText('Confirm the acknowledgement first');
    expect(message.id).toBeTruthy();
    const ack = screen.getByRole('checkbox', { name: /kept for up to 90 days/ });
    expect(ack.getAttribute('aria-describedby')).toBe(message.id);
    expect(screen.queryByText('Validation failed')).toBeNull();
  });

  it('puts a cause with no field on screen in the alert', async () => {
    responses['PUT /admin/ai/settings'] = {
      status: 422,
      body: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', causes: { allowedRoles: ['Each role once'] } },
      },
    };
    setup();
    fireEvent.click(await screen.findByRole('switch', { name: 'Turn on the AI assistant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Each role once');
  });

  it('treats Remove key as an unsaved change, so Test waits for Save', async () => {
    setup();
    const test = (await screen.findByRole('button', { name: 'Test connection' })) as HTMLButtonElement;
    expect(test.disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Remove key' }));
    expect(test.disabled).toBe(true);
    expect(test.title).toBe('Save first');
  });

  it('shows the Test connection result inline', async () => {
    responses['POST /admin/ai/settings/test'] = ok({ ok: true, message: 'Connected: gemini replied.' });
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Test connection' }));
    expect(await screen.findByText('Connected: gemini replied.')).toBeTruthy();
  });

  it('shows the conflict message and loads the other version', async () => {
    gets = [ok(doc({ model: 'old-model' }, 3)), ok(doc({ model: 'their-model' }, 4))];
    responses['PUT /admin/ai/settings'] = {
      status: 409,
      body: {
        success: false,
        error: { code: 'CONFLICT', message: 'Someone else saved a moment ago', current: { version: 4 } },
      },
    };
    setup();
    fireEvent.click(await screen.findByRole('switch', { name: 'Turn on the AI assistant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect((screen.getByLabelText('Model') as HTMLInputElement).value).toBe('their-model'));
    expect((await screen.findByRole('alert')).textContent).toBe(CONFLICT_NOTICE);
  });

  it('shows a disabled form and no Save for a role that cannot manage', async () => {
    setup(editor);
    const model = await screen.findByLabelText('Model');
    expect(model.closest('fieldset')?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('is read-only while viewing as someone', async () => {
    setup({ ...owner, impersonatedBy: 'real-admin' });
    const model = await screen.findByLabelText('Model');
    expect(model.closest('fieldset')?.disabled).toBe(true);
    expect(screen.getAllByText(/View-as is read-only/).length).toBeGreaterThan(0);
  });

  it('notes the mock provider and a missing encryption key', async () => {
    gets = [ok({ ...doc(), mock: true, keyAvailable: false })];
    setup();
    expect(await screen.findByText(/Mock provider is on/)).toBeTruthy();
    expect(screen.getByText(/no APP_ENCRYPTION_KEY/)).toBeTruthy();
  });
});
