// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SupportKnowledgeStatusDto } from '@/lib/support/types';

import { SupportKnowledgeSync } from './support-knowledge-sync';

const can = vi.hoisted(() => ({ value: true }));
vi.mock('@/contexts/actor-provider', () => ({ useCan: () => can.value }));

const base: SupportKnowledgeStatusDto = {
  status: 'idle',
  step: null,
  total: 6,
  done: 0,
  chunks: 0,
  error: null,
  lastSyncedAt: null,
  stale: true,
};

// Each GET returns the next status in the list (the last one repeats); POST starts the sync.
const server = (statuses: SupportKnowledgeStatusDto[], started = statuses[0]!) => {
  let i = 0;
  const posts: string[] = [];
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      posts.push(url);
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: started }), { status: 202 }));
    }
    const data = statuses[Math.min(i++, statuses.length - 1)];
    return Promise.resolve(new Response(JSON.stringify({ success: true, data }), { status: 200 }));
  });
  return posts;
};

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SupportKnowledgeSync />
    </QueryClientProvider>,
  );

beforeEach(() => {
  can.value = true;
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('SupportKnowledgeSync', () => {
  it('says the site was never synced and flags it as needing a sync', async () => {
    server([base]);
    mount();
    await screen.findByText(/Not synced yet/);
    expect(screen.getByText('Sync needed')).toBeTruthy();
  });

  it('shows a progress bar with the current step until the sync finishes, then the result', async () => {
    const running = { ...base, status: 'running' as const, step: 'Services and prices', done: 2 };
    const done = {
      ...base,
      status: 'done' as const,
      done: 6,
      chunks: 42,
      stale: false,
      lastSyncedAt: '2026-11-10T10:00:00Z',
    };
    const posts = server([base, running, done], running);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Sync website data' }));

    const bar = await screen.findByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('33');
    expect(screen.getByText(/Services and prices · 33%/)).toBeTruthy();
    expect(posts).toHaveLength(1);

    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull(), { timeout: 3000 });
    expect(screen.getByText(/42 pieces of information in memory/)).toBeTruthy();
    expect(screen.queryByText('Sync needed')).toBeNull();
  });

  it('shows why a failed sync stopped', async () => {
    server([{ ...base, status: 'failed', error: 'The sync stopped before it finished. Try again.' }]);
    mount();
    await screen.findByText('The sync stopped before it finished. Try again.');
  });

  it('says so when the status cannot be loaded, instead of hiding the section', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(JSON.stringify({ success: false, error: { message: 'Internal error' } }), { status: 500 }),
      ),
    );
    mount();
    expect((await screen.findByRole('alert')).textContent).toContain('Internal error');
  });

  it('disables the button for someone who may not change settings', async () => {
    can.value = false;
    server([base]);
    mount();
    const button = await screen.findByRole('button', { name: 'Sync website data' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
