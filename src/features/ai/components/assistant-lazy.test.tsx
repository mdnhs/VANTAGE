// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MePayload } from '@/lib/auth/me';

import { AiAssistant } from './assistant';

const mocks = vi.hoisted(() => ({ chatLoaded: 0, actor: null as unknown as MePayload }));
vi.mock('@/contexts/actor-provider', () => ({ useActor: () => mocks.actor }));
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard/about' }));
// The factory runs when the module is first imported.
vi.mock('@ai-sdk/react', () => {
  mocks.chatLoaded++;
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
const renderAssistant = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AiAssistant />
    </QueryClientProvider>,
  );

beforeEach(() => {
  mocks.actor = me();
  stubStatus();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AiAssistant lazy chunk', () => {
  // First: the module cache keeps the chat chunk once any test has loaded it.
  it('keeps the AI SDK client out of the first load: the chat chunk loads when the button is used', async () => {
    renderAssistant();
    const trigger = await screen.findByRole('button', { name: 'AI assistant' });
    expect(trigger.getAttribute('aria-keyshortcuts')).toBe('Meta+J Control+J');
    expect(mocks.chatLoaded).toBe(0);
    fireEvent.click(trigger);
    await screen.findByLabelText('Message the AI assistant', {}, { timeout: 5000 });
    expect(mocks.chatLoaded).toBe(1);
  });
});
