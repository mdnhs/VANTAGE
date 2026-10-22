// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationsTestEmail, testEmailMessage } from './notifications-test-email';

const can = vi.hoisted(() => ({ value: true }));
vi.mock('@/contexts/actor-provider', () => ({ useCan: () => can.value }));

const reply = (data: unknown) => {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ success: true, data }), { status: 200 })));
};

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

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <NotificationsTestEmail />
    </QueryClientProvider>,
  );

describe('NotificationsTestEmail', () => {
  it('shows "SMTP not configured" when the server has no SMTP', async () => {
    reply({ status: 'not_configured' });
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Send test email' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('SMTP not configured'));
  });

  it('confirms where the test mail went', async () => {
    reply({ status: 'sent', to: 'me@example.com' });
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Send test email' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Test email sent to me@example.com'));
  });

  it('is hidden without settings.update', () => {
    can.value = false;
    mount();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('maps every result to a message', () => {
    expect(testEmailMessage({ status: 'failed', error: 'ECONNREFUSED' })).toBe('Test email failed: ECONNREFUSED');
  });
});

describe('settings page', () => {
  it('renders the test-email control for the notifications slug only', () => {
    const src = readFileSync(
      'src/app/(main)/(protected)/(dashboard_layout)/dashboard/settings/[slug]/page.tsx',
      'utf8',
    );
    expect(src).toContain("slug === 'notifications' ? <NotificationsTestEmail />");
  });
});
