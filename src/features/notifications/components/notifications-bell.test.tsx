// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NotificationItem, NotificationsDto } from '@/lib/notifications';

import { NotificationsBell } from './notifications-bell';

const item = (i: number, unread = true): NotificationItem => ({
  id: `quote:${i}`,
  kind: 'quote',
  title: 'New quote request',
  description: `From Person${i}`,
  href: `/dashboard/quotes/${i}`,
  at: new Date().toISOString(),
  unread,
});

const dto = (unread: number, total = unread): NotificationsDto => ({
  items: Array.from({ length: total }, (_, i) => item(i, i < unread)),
  unread,
  seenAt: new Date(0).toISOString(),
});

let seenStatus = 200;
let seenCalls = 0;

function stubFetch(feed: NotificationsDto) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.endsWith('/notifications/seen')) {
        seenCalls += 1;
        return Promise.resolve(
          seenStatus === 200
            ? new Response(JSON.stringify({ success: true, data: { seenAt: new Date().toISOString() } }))
            : new Response(
                JSON.stringify({ success: false, error: { code: 'IMPERSONATION_READ_ONLY', message: 'no' } }),
                {
                  status: seenStatus,
                },
              ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: feed })));
    }),
  );
}

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <NotificationsBell />
    </QueryClientProvider>,
  );

beforeEach(() => {
  seenStatus = 200;
  seenCalls = 0;
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('NotificationsBell', () => {
  it('caps the badge at 9+', async () => {
    stubFetch(dto(12));
    mount();
    await screen.findByRole('button', { name: 'Notifications (9+ unread)' });
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('shows no badge when nothing is unread', async () => {
    stubFetch(dto(0, 2));
    mount();
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled());
    const button = await screen.findByRole('button', { name: 'Notifications' });
    expect(button.textContent).toBe('');
  });

  it('marks seen exactly once when opened with unread items, and lists them', async () => {
    stubFetch(dto(2));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications (2 unread)' }));
    await screen.findByText('From Person0');
    expect(screen.getByText('From Person1')).toBeTruthy();
    expect(screen.getAllByText('New quote request')).toHaveLength(2);
    expect(screen.getByText('From Person0').closest('a')?.getAttribute('href')).toBe('/dashboard/quotes/0');
    await waitFor(() => expect(seenCalls).toBe(1));
    await screen.findByRole('button', { name: 'Notifications' });
    expect(screen.getAllByText('(new)')).toHaveLength(2);
  });

  it('does not call seen when opened with nothing unread', async () => {
    stubFetch(dto(0, 1));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications' }));
    await screen.findByText('From Person0');
    expect(seenCalls).toBe(0);
  });

  it('swallows a 403 from seen (view-as) and keeps the badge', async () => {
    seenStatus = 403;
    stubFetch(dto(3));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications (3 unread)' }));
    await waitFor(() => expect(seenCalls).toBe(1));
    await screen.findByText('From Person0');
    expect(screen.getByRole('button', { name: 'Notifications (3 unread)' })).toBeTruthy();
  });

  it('shows the empty copy', async () => {
    stubFetch(dto(0));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications' }));
    await screen.findByText(/You're all caught up/);
  });
});
