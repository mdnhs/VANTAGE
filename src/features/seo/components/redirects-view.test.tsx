// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RedirectsView } from './redirects-view';

const actor = vi.hoisted(() => ({ can: true, impersonatedBy: null as string | null }));
vi.mock('@/contexts/actor-provider', () => ({
  useActor: () => ({ roles: ['marketer'], impersonatedBy: actor.impersonatedBy, user: { id: 'u1' } }),
  useCan: () => actor.can,
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const row = {
  id: '0b5f3c1e-1d2a-4c8b-9e7f-123456789abc',
  sourcePath: '/old-about',
  destination: '/about',
  statusCode: 301,
  isActive: true,
  hitCount: 4,
  lastHitAt: null,
  note: '',
  updatedAt: '2026-10-01T09:00:00.000Z',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let writeResponse: () => Response;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  actor.can = true;
  actor.impersonatedBy = null;
  toast.success.mockClear();
  writeResponse = () => json({ success: true, data: { ...row, isActive: false } });
  fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method && init.method !== 'GET'
      ? writeResponse()
      : json({ success: true, data: [row], pagination: { total: 1, page: 1, limit: 25 } }),
  );
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderView(searchParams = '') {
  render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RedirectsView />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
}

const writes = () => fetchMock.mock.calls.filter(([, init]) => init?.method && init.method !== 'GET');

describe('RedirectsView', () => {
  it('renders a row with its type, hits, last hit and status', async () => {
    renderView();
    expect(await screen.findByText('/old-about')).toBeTruthy();
    expect(screen.getByText('/about')).toBeTruthy();
    expect(screen.getByText('301 Permanent')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('Never')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows the loop error under To', async () => {
    writeResponse = () =>
      json(
        {
          success: false,
          error: { message: 'Invalid', causes: { destination: ['That would create a redirect loop'] } },
        },
        422,
      );
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'New redirect' }));
    fireEvent.change(await screen.findByLabelText('From'), { target: { value: '/b' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '/a' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const message = await screen.findByText('That would create a redirect loop');
    expect(message.closest('[data-slot="field"]')?.querySelector('#redirect-to')).toBeTruthy();
  });

  it('shows the duplicate 409 under From', async () => {
    writeResponse = () =>
      json(
        {
          success: false,
          error: {
            message: 'A redirect from that address already exists',
            causes: { sourcePath: ['A redirect from that address already exists'] },
          },
        },
        409,
      );
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'New redirect' }));
    fireEvent.change(await screen.findByLabelText('From'), { target: { value: '/old-about' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '/about' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const message = await screen.findByText('A redirect from that address already exists');
    expect(message.closest('[data-slot="field"]')?.querySelector('#redirect-from')).toBeTruthy();
  });

  it('shows an unmapped error as a form-level alert', async () => {
    writeResponse = () =>
      json({ success: false, error: { message: 'Something went wrong', causes: { other: ['x'] } } }, 500);
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'New redirect' }));
    fireEvent.change(await screen.findByLabelText('From'), { target: { value: '/b' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '/a' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Something went wrong');
  });

  it('turns a redirect off with a PATCH and a toast', async () => {
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'Turn off /old-about' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Redirect off'));
    const [url, init] = writes()[0]!;
    expect(String(url)).toContain(`/admin/redirects/${row.id}`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({ isActive: false });
  });

  it('confirms before deleting', async () => {
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete /old-about' }));
    expect(await screen.findByText('Delete this redirect?')).toBeTruthy();
    expect(writes()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Redirect deleted'));
    expect(writes()[0]![1].method).toBe('DELETE');
  });

  it('hides every write control without redirect.manage', async () => {
    actor.can = false;
    renderView();
    await screen.findByText('/old-about');
    expect(screen.queryByRole('button', { name: 'New redirect' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Edit/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Turn o/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Delete/ })).toBeNull();
  });

  it('is read-only under View-as', async () => {
    actor.impersonatedBy = 'owner-1';
    renderView();
    await screen.findByText('/old-about');
    expect(screen.queryByRole('button', { name: 'New redirect' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Edit/ })).toBeNull();
  });

  it('sends the initial ?q= search', async () => {
    renderView('?q=old');
    await screen.findByText('/old-about');
    const url = new URL(String(fetchMock.mock.calls[0]![0]), 'http://x');
    expect(url.searchParams.get('q')).toBe('old');
  });
});
