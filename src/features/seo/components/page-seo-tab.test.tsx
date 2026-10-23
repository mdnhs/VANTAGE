// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

import { PageSeoTab } from './page-seo-tab';

const actor = vi.hoisted(() => ({ can: true, impersonatedBy: null as string | null }));
vi.mock('@/contexts/actor-provider', () => ({
  useCan: () => actor.can,
  useActor: () => ({ impersonatedBy: actor.impersonatedBy }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const puts: string[] = [];
beforeEach(() => {
  actor.can = true;
  actor.impersonatedBy = null;
  puts.length = 0;
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    if (init.method === 'PUT') {
      puts.push(`PUT ${url.split('/api/v1')[1]}`);
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: { key: 'x', version: 2, value: {} } })),
      );
    }
    if (url.endsWith('/site-settings')) {
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: { businessName: 'Vantage Autobody' } })),
      );
    }
    const key = url.split('/admin/globals/')[1];
    const value =
      key === 'site'
        ? parseGlobal('site', {})
        : key === 'seo'
          ? parseGlobal('seo', {})
          : parseGlobal('seo.page.services', {});
    return Promise.resolve(new Response(JSON.stringify({ success: true, data: { key, version: 1, value } })));
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const renderTab = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PageSeoTab id='services' />
    </QueryClientProvider>,
  );

describe('PageSeoTab', () => {
  it('saves to the page global when the role may update', async () => {
    renderTab();
    const field = await screen.findByLabelText('SEO title');
    expect(field.closest('fieldset')?.disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Save services page seo' }));
    await waitFor(() => expect(puts).toEqual(['PUT /admin/globals/seo.page.services']));
  });

  it('is read-only for a role that can only read', async () => {
    actor.can = false;
    renderTab();
    expect((await screen.findByLabelText('SEO title')).closest('fieldset')?.disabled).toBe(true);
  });

  it('is read-only under View-as', async () => {
    actor.impersonatedBy = 'owner-id';
    renderTab();
    expect((await screen.findByLabelText('SEO title')).closest('fieldset')?.disabled).toBe(true);
  });
});
