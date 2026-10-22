// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MePayload } from '@/lib/auth/me';

import { AI_KEYS } from '../utils/query-keys';
import { AiAssistant } from './assistant';

const mocks = vi.hoisted(() => ({ actor: null as unknown as MePayload }));
vi.mock('@/contexts/actor-provider', () => ({ useActor: () => mocks.actor }));
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard/about' }));
vi.mock('@ai-sdk/react', () => {
  return {
    useChat: () => ({
      messages: [],
      status: 'ready',
      error: undefined,
      stop: vi.fn(),
      setMessages: vi.fn(),
      clearError: vi.fn(),
      sendMessage: vi.fn(),
    }),
  };
});

const me = (impersonatedBy: string | null = null): MePayload => ({
  user: { id: 'u1', email: 'e@x.ie', name: 'Eddie' },
  roles: ['editor'],
  permissions: { ai: ['use'] },
  twoFactorEnabled: false,
  impersonatedBy,
});

const status = {
  available: true,
  canManage: false,
  provider: 'google',
  model: 'gemini-flash-latest',
  freeTierWarning: false,
};
function stubStatus(over: Record<string, unknown> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, data: { ...status, ...over } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    ),
  );
}
const renderAssistant = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AiAssistant />
    </QueryClientProvider>,
  );
  return client;
};

beforeEach(() => {
  mocks.actor = me();
  stubStatus();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AiAssistant', () => {
  it('tells assistive tech that the button opens a dialog', async () => {
    renderAssistant();
    const trigger = await screen.findByRole('button', { name: 'AI assistant' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'));
  });

  it('focuses the message box on open and returns focus to the button on close', async () => {
    renderAssistant();
    const trigger = await screen.findByRole('button', { name: 'AI assistant' });
    fireEvent.click(trigger);
    const box = await screen.findByLabelText('Message the AI assistant');
    await waitFor(() => expect(document.activeElement).toBe(box));
    fireEvent.keyDown(box, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('opens and closes with Ctrl+J', async () => {
    renderAssistant();
    await screen.findByRole('button', { name: 'AI assistant' });
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
    await screen.findByLabelText('Message the AI assistant');
  });

  it('uses the page starters and names the page on the chip for an editor route', async () => {
    renderAssistant();
    fireEvent.click(await screen.findByRole('button', { name: 'AI assistant' }));
    expect(await screen.findByRole('button', { name: 'Write a meta description for this page' })).toBeTruthy();
    expect(screen.getByText('About page').parentElement!.textContent).toBe('Using: About page');
  });

  it('hides for gated non-managers', async () => {
    stubStatus({ available: false, canManage: false, provider: null, model: null });
    const client = renderAssistant();
    await waitFor(() => expect(client.getQueryState(AI_KEYS.status)?.status).toBe('success'));
    expect(screen.queryByRole('button', { name: 'AI assistant' })).toBeNull();
  });

  it('shows the set-up link to managers when unavailable', async () => {
    stubStatus({ available: false, canManage: true });
    renderAssistant();
    fireEvent.click(await screen.findByRole('button', { name: 'AI assistant' }));
    const link = await screen.findByRole('link', { name: 'Set up AI assistant' });
    expect(link.getAttribute('href')).toBe('/dashboard/settings/ai-assistant');
    expect(screen.queryByLabelText('Message the AI assistant')).toBeNull();
  });

  it('is read-only while viewing as someone', async () => {
    mocks.actor = me('owner-1');
    renderAssistant();
    fireEvent.click(await screen.findByRole('button', { name: 'AI assistant' }));
    const box = (await screen.findByLabelText('Message the AI assistant')) as HTMLTextAreaElement;
    expect(box.disabled).toBe(true);
    expect(screen.getByText(/while viewing as someone, but not send messages/)).toBeTruthy();
  });
});
