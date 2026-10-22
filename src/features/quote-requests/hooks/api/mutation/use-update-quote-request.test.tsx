// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateQuoteRequest } from './use-update-quote-request';

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  toast.error.mockClear();
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('useUpdateQuoteRequest', () => {
  it('toasts the server message when View-as refuses the write (403)', async () => {
    const message = 'View-as is read-only. Stop viewing as to make changes.';
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ success: false, error: { code: 'IMPERSONATION_READ_ONLY', message } }), {
            status: 403,
          }),
        ),
      ),
    );
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateQuoteRequest('q1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ status: 'contacted' }).catch(() => undefined);
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
  });
});
