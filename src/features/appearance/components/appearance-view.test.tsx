// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkTheme } from '@/lib/theme/checks';
import { DEFAULT_THEME, ThemeConfig } from '@/lib/theme/schema';

import { AppearanceView } from './appearance-view';

const can = vi.hoisted(() => ({ update: true, publish: true, viewAs: false }));
vi.mock('@/contexts/actor-provider', () => ({
  useActor: () => ({ impersonatedBy: can.viewAs ? 'owner-1' : null }),
  useCan: (p: { appearance?: string[]; settings?: string[] }) => {
    if (p.appearance?.includes('publish')) return can.publish;
    if (p.appearance?.includes('update')) return can.update;
    return true;
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));
// happy-dom cannot load or reload a frame.
const nav = vi.hoisted(() => ({ refresh: vi.fn(), keys: [] as (number | null)[] }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: nav.refresh }) }));
vi.mock('./site-preview-pane', () => ({
  SitePreviewPane: ({ refreshKey }: { refreshKey: number | null }) => {
    nav.keys.push(refreshKey);
    return null;
  },
}));
// The upload widget needs the Cloudinary client; it is not under test here.
vi.mock('@/components/admin/schema-form/widgets/image-widget', () => ({ ImageWidget: () => null }));

type Call = { method: string; url: string; body: unknown };
let calls: Call[];
let doc: ReturnType<typeof docFor>;
let publishStatus: number;
let revisions: unknown[];

const docFor = (draft: unknown, version = 3, hasDraft = true) => {
  const parsed = ThemeConfig.parse(draft);
  return { value: DEFAULT_THEME, draft: parsed, hasDraft, version, updatedAt: null, issues: checkTheme(parsed) };
};
const envelope = (data: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify({ success: true, data }), { status }));

beforeEach(() => {
  can.update = true;
  can.publish = true;
  can.viewAs = false;
  calls = [];
  nav.keys = [];
  doc = docFor({});
  publishStatus = 200;
  revisions = [];
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      calls.push({ method, url, body });
      if (url.includes('/admin/theme/revisions') && method === 'POST')
        return envelope({ ...doc, version: body.version + 1 });
      if (url.endsWith('/admin/theme/revisions')) return envelope({ items: revisions });
      if (url.endsWith('/admin/theme/draft'))
        return envelope({ ...docFor(body.draft, body.version + 1), hasDraft: true });
      if (url.endsWith('/admin/theme/publish')) {
        return publishStatus === 409
          ? Promise.resolve(
              new Response(
                JSON.stringify({
                  success: false,
                  error: {
                    code: 'CONFLICT',
                    message: 'Version conflict',
                    current: { version: 9, updatedAt: null, updatedBy: 'Alex' },
                  },
                }),
                { status: 409 },
              ),
            )
          : envelope({ ...doc, hasDraft: false, version: doc.version + 1 });
      }
      if (url.endsWith('/admin/theme')) return envelope(doc);
      if (url.includes('/site'))
        return envelope({ key: 'site', value: {}, version: 1, updatedAt: null, updatedBy: null });
      return envelope({});
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AppearanceView autosaveDelay={0} />
    </QueryClientProvider>,
  );
}

const themeGets = () => calls.filter((c) => c.method === 'GET' && c.url.endsWith('/admin/theme')).length;

describe('AppearanceView', () => {
  it('renders the Site and Admin tabs and Publish', async () => {
    renderView();
    expect(await screen.findByRole('tab', { name: 'Site' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Admin' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeTruthy();
  });

  it('hides Publish from a role without appearance.publish', async () => {
    can.publish = false;
    renderView();
    await screen.findByRole('tab', { name: 'Site' });
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
  });

  it('blocks Publish and explains a failing pair', async () => {
    doc = docFor({ site: { brand: '#ffd400' } });
    renderView();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Publishing is blocked until every pair passes.');
    expect(alert.textContent).toMatch(/Text on brand on Brand is \d\.\d{2}:1/);
    expect((screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables the controls for an actor without appearance.update', async () => {
    can.update = false;
    renderView();
    const brand = await screen.findByLabelText('Brand');
    expect(brand.closest('fieldset')?.disabled).toBe(true);
  });

  it('is read-only while viewing as another user', async () => {
    can.viewAs = true;
    renderView();
    const brand = await screen.findByLabelText('Brand');
    expect(brand.closest('fieldset')?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
  });

  it('publishes with the current version and toasts', async () => {
    doc = docFor({ site: { brand: '#c42424' } });
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Theme published'));
    expect(calls.find((c) => c.url.endsWith('/admin/theme/publish'))?.body).toEqual({ version: 3 });
    // The admin layout re-reads the published theme, and the site preview reloads.
    expect(nav.refresh).toHaveBeenCalledOnce();
    expect(nav.keys.at(-1)).toBeGreaterThan(0);
    // Nothing left to publish: the button disables again.
    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled).toBe(true),
    );
  });

  it('on a stale publish toasts, and loads the other version', async () => {
    publishStatus = 409;
    doc = docFor({ site: { brand: '#c42424' } });
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Changed by someone else. Their version is loaded.'));
    await waitFor(() => expect(themeGets()).toBeGreaterThanOrEqual(2));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('History "Load into draft" posts the restore and toasts', async () => {
    revisions = [
      {
        id: '0b2c3b1e-6f0a-4a63-9d64-0d4d3f4f6a11',
        version: 2,
        note: 'Published theme',
        createdAt: '2026-10-01T10:00:00.000Z',
        createdBy: 'u1',
        createdByName: 'Alex',
      },
    ];
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'Load into draft' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Loaded into the draft'));
    const post = calls.find((c) => c.method === 'POST' && c.url.endsWith('/restore'));
    expect(post?.url).toContain('/admin/theme/revisions/0b2c3b1e-6f0a-4a63-9d64-0d4d3f4f6a11/restore');
    expect(post?.body).toEqual({ version: 3 });
    // The draft changed without an autosave, so the site preview must reload.
    expect(nav.keys.at(-1)).toBeGreaterThan(0);
    expect(nav.refresh).not.toHaveBeenCalled();
  });

  it('shows "Nothing published yet." when there is no history', async () => {
    renderView();
    expect(await screen.findByText('Nothing published yet.')).toBeTruthy();
  });

  it('a font picker change schedules a draft with site.fonts.heading', async () => {
    renderView();
    const trigger = await screen.findByRole('combobox', { name: 'Heading' });
    fireEvent.click(trigger);
    const list = await screen.findByRole('listbox');
    const option = within(list).getByRole('option', { name: 'Sora' });
    // Base UI picks on pointer-up (press-drag-release) as well as on click.
    fireEvent.pointerDown(option);
    fireEvent.mouseDown(option);
    fireEvent.pointerUp(option);
    fireEvent.mouseUp(option);
    fireEvent.click(option);
    await waitFor(() => {
      const save = calls.find((c) => c.method === 'PUT' && c.url.endsWith('/admin/theme/draft'));
      expect(save?.body).toMatchObject({ version: 3, draft: { site: { fonts: { heading: 'sora' } } } });
    });
  });
});
