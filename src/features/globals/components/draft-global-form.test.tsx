// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

import { GlobalForm } from './global-form';

const can = vi.hoisted(() => ({ value: true }));
vi.mock('@/contexts/actor-provider', () => ({
  useCan: () => can.value,
  useActor: () => ({ impersonatedBy: null }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// The preview frame is covered by its own test; here only its refreshes matter.
const refreshes = vi.hoisted(() => ({ keys: [] as (number | null)[] }));
vi.mock('@/components/admin/site-preview-pane', () => ({
  SitePreviewPane: ({ path, refreshKey }: { path: string; refreshKey: number | null }) => {
    refreshes.keys.push(refreshKey);
    return <div data-testid='preview' data-path={path} />;
  },
}));

const published = parseGlobal('page.services', {});
const withEyebrow = (eyebrow: string) => ({ ...published, hero: { ...published.hero, eyebrow } });

let draft: unknown;
let calls: { method: string; url: string; body: unknown }[];

const respond = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  can.value = true;
  draft = null;
  calls = [];
  refreshes.keys = [];
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    calls.push({ method, url, body: init.body ? JSON.parse(String(init.body)) : undefined });
    if (url.endsWith('/draft')) return respond({ success: true, data: { key: 'page.services' } });
    if (method === 'PUT') return respond({ success: true, data: { key: 'page.services', version: 2, value: {} } });
    return respond({
      success: true,
      data: { key: 'page.services', version: 1, updatedAt: null, updatedBy: null, value: published, draft },
    });
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const renderForm = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GlobalForm settingKey='page.services' />
    </QueryClientProvider>,
  );
};
// The top banner's badge (the FAQ has one with the same label further down).
const badge = async () => (await screen.findAllByLabelText('Small label above the title'))[0] as HTMLInputElement;
const draftSaves = () => calls.filter((c) => c.method === 'PUT' && c.url.endsWith('/draft'));

describe('website page copy editor', () => {
  it('previews the matching public page beside the form', async () => {
    renderForm();
    expect((await screen.findByTestId('preview')).dataset.path).toBe('/services');
    expect(screen.getByRole('button', { name: 'Publish changes' })).toBeTruthy();
  });

  it('saves edits as a draft on its own and refreshes the preview', async () => {
    renderForm();
    fireEvent.change(await badge(), { target: { value: 'Draft badge' } });
    await waitFor(() => expect(draftSaves()).toHaveLength(1), { timeout: 3000 });
    expect((draftSaves()[0]!.body as { draft: { hero: { eyebrow: string } } }).draft.hero.eyebrow).toBe('Draft badge');
    // Nothing went live: the only PUT is the draft.
    expect(calls.filter((c) => c.method === 'PUT' && !c.url.endsWith('/draft'))).toHaveLength(0);
    await waitFor(() => expect(refreshes.keys.at(-1)).toBeTruthy());
    expect(await screen.findByText(/changes that are not live yet/)).toBeTruthy();
  });

  it('starts from an unpublished draft and can discard it', async () => {
    draft = withEyebrow('Saved draft');
    renderForm();
    expect((await badge()).value).toBe('Saved draft');
    draft = null;
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.url.endsWith('/draft'))).toBe(true));
    await waitFor(async () => expect((await badge()).value).toBe(published.hero.eyebrow));
    expect(screen.queryByText(/changes that are not live yet/)).toBeNull();
  });

  it('publishes through the version-guarded save', async () => {
    renderForm();
    fireEvent.change(await badge(), { target: { value: 'Live badge' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish changes' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT' && !c.url.endsWith('/draft'))).toBe(true));
    const publish = calls.find((c) => c.method === 'PUT' && !c.url.endsWith('/draft'))!;
    expect(publish.body).toMatchObject({ version: 1, value: { hero: { eyebrow: 'Live badge' } } });
  });

  it('is read-only without update permission and never writes a draft', async () => {
    can.value = false;
    renderForm();
    // The whole form sits in a disabled fieldset.
    expect((await badge()).closest('fieldset[disabled]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Publish changes' })).toBeNull();
  });
});
