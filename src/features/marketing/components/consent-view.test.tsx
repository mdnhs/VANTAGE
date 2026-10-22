// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GLOBALS } from '@/lib/content/globals';

import { ConsentView } from './consent-view';

vi.mock('@/contexts/actor-provider', () => ({ useCan: () => true }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal('fetch', () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          success: true,
          data: { key: 'consent', version: 1, updatedAt: null, updatedBy: null, value: GLOBALS.consent.parse({}) },
        }),
      ),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('ConsentView', () => {
  it('updates the preview heading while typing, before saving', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ConsentView />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Cookies on this site', level: 2 })).toBeTruthy();
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Your privacy choices' } });
    expect(await screen.findByRole('heading', { name: 'Your privacy choices', level: 2 })).toBeTruthy();
  });
});
