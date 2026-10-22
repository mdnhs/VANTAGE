// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CONFLICT_MESSAGE } from '@/features/globals/lib/submit-result';

import type { TrackingAdmin } from '../types';
import { STATUS_LABELS, TrackingStatus } from './tracking-status';
import { TOKEN_PLACEHOLDER, TrackingView } from './tracking-view';

const actor = vi.hoisted(() => ({
  roles: ['owner'] as string[],
  canUpdate: true,
  impersonatedBy: null as string | null,
}));
vi.mock('@/contexts/actor-provider', () => ({
  useActor: () => ({ roles: actor.roles, impersonatedBy: actor.impersonatedBy }),
  useCan: () => actor.canUpdate,
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const doc = (over: Partial<TrackingAdmin> = {}): TrackingAdmin => ({
  version: 1,
  value: {
    gtmId: 'GTM-TEST123',
    ga4Id: 'G-TEST123',
    metaPixelId: '1234567890',
    testEventCode: 'TEST123',
    enabled: { gtm: true, ga4: true, meta: false, capi: false },
    enhancedMatching: { enabled: false, acknowledgedAt: null, acknowledgedBy: null },
  },
  capiToken: { configured: true, readable: true },
  keyAvailable: true,
  status: { gtm: 'ready', ga4: 'ready', meta: 'off', capi: 'off' },
  lastCapiFailure: null,
  ...over,
});

let docs: TrackingAdmin[];
let putBodies: Record<string, unknown>[];
let putStatus: number;
let testResult: { ok: boolean; status: number; message: string };

const respond = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  actor.roles = ['owner'];
  actor.canUpdate = true;
  actor.impersonatedBy = null;
  docs = [doc()];
  putBodies = [];
  putStatus = 200;
  testResult = { ok: true, status: 200, message: 'Meta received the test event' };
  toast.success.mockClear();
  toast.error.mockClear();
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    if (url.endsWith('/test-capi')) return respond({ success: true, data: testResult });
    if (init.method === 'PUT') {
      putBodies.push(JSON.parse(init.body as string));
      if (putStatus === 409) {
        return respond({ success: false, error: { code: 'CONFLICT', message: 'Version conflict' } }, 409);
      }
      if (putStatus === 422) {
        return respond(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Validation failed', causes: { capiToken: ['No key'] } },
          },
          422,
        );
      }
      return respond({ success: true, data: doc({ version: 2 }) });
    }
    return respond({ success: true, data: docs.length > 1 ? docs.shift() : docs[0] });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const renderView = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TrackingView />
    </QueryClientProvider>,
  );
};
const tokenInput = async () => (await screen.findByLabelText('Conversions API access token')) as HTMLInputElement;
// Base UI's switch is not a native control: disabled shows as aria-disabled.
const isDisabled = (el: HTMLElement) => el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('data-disabled');
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save tracking' }));

describe('TrackingView', () => {
  it('never prefills the token, even when one is configured', async () => {
    renderView();
    const input = await tokenInput();
    expect(input.value).toBe('');
    expect(input.placeholder).toBe(TOKEN_PLACEHOLDER);
    expect(screen.getByText('Configured')).toBeTruthy();
  });

  it('omits capiToken when none is typed', async () => {
    renderView();
    await tokenInput();
    save();
    await waitFor(() => expect(putBodies).toHaveLength(1));
    expect(putBodies[0]).not.toHaveProperty('capiToken');
    expect(putBodies[0]).toMatchObject({ version: 1, value: { gtmId: 'GTM-TEST123' } });
    expect(putBodies[0]).not.toHaveProperty('enhancedMatching');
  });

  it('sends a typed token to replace the stored one', async () => {
    renderView();
    fireEvent.change(await tokenInput(), { target: { value: 'x'.repeat(24) } });
    save();
    await waitFor(() => expect(putBodies[0]).toMatchObject({ capiToken: 'x'.repeat(24) }));
  });

  it('sends capiToken null after Remove token', async () => {
    renderView();
    await tokenInput();
    fireEvent.click(screen.getByRole('button', { name: 'Remove token' }));
    expect(screen.getByText('Will be removed when you save')).toBeTruthy();
    save();
    await waitFor(() => expect(putBodies[0]).toHaveProperty('capiToken', null));
  });

  it('shows the conflict message and loads the other version on a 409', async () => {
    putStatus = 409;
    docs = [doc(), doc({ version: 2, value: { ...doc().value, gtmId: 'GTM-OTHER99' } })];
    renderView();
    await tokenInput();
    save();
    await waitFor(() =>
      expect((screen.getByLabelText('GTM container ID') as HTMLInputElement).value).toBe('GTM-OTHER99'),
    );
    expect((await screen.findByRole('alert')).textContent).toBe(CONFLICT_MESSAGE);
  });

  it('maps a 422 onto the field', async () => {
    putStatus = 422;
    renderView();
    await tokenInput();
    save();
    expect(await screen.findByText('No key')).toBeTruthy();
  });

  it('disables enhanced matching for a non-owner', async () => {
    actor.roles = ['marketer'];
    renderView();
    await tokenInput();
    expect(isDisabled(screen.getByRole('switch', { name: /hashed email and phone/ }))).toBe(true);
  });

  it('needs the acknowledgement before an owner can turn enhanced matching on', async () => {
    renderView();
    await tokenInput();
    const sw = screen.getByRole('switch', { name: /hashed email and phone/ });
    expect(isDisabled(sw)).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(isDisabled(sw)).toBe(false));
    fireEvent.click(sw);
    save();
    await waitFor(() => expect(putBodies[0]).toMatchObject({ enhancedMatching: { enabled: true, acknowledge: true } }));
  });

  it('is a disabled form without a Save button for a role that cannot update', async () => {
    actor.canUpdate = false;
    renderView();
    const input = await tokenInput();
    expect(input.closest('fieldset')?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Save tracking' })).toBeNull();
    expect((screen.getByRole('button', { name: 'Send test event' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('is read-only while viewing as another user', async () => {
    actor.impersonatedBy = 'owner-id';
    renderView();
    await tokenInput();
    expect(screen.queryByRole('button', { name: 'Save tracking' })).toBeNull();
  });

  it('shows the server message of the test event in a toast', async () => {
    renderView();
    await tokenInput();
    fireEvent.click(screen.getByRole('button', { name: 'Send test event' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Meta received the test event'));
    testResult = { ok: false, status: 400, message: 'Meta said no' };
    fireEvent.click(screen.getByRole('button', { name: 'Send test event' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Meta said no'));
  });

  it('shows the missing-key notice and disables the token input', async () => {
    docs = [doc({ keyAvailable: false, capiToken: { configured: false, readable: null } })];
    renderView();
    const input = await tokenInput();
    expect(input.disabled).toBe(true);
    expect(screen.getByRole('note').textContent).toContain('APP_ENCRYPTION_KEY');
  });
});

describe('TrackingStatus', () => {
  it('renders a label per channel status', () => {
    render(
      <TrackingStatus
        doc={{
          status: { gtm: 'ready', ga4: 'needs-gtm', meta: 'needs-banner', capi: 'no-token' },
          lastCapiFailure: null,
        }}
      />,
    );
    for (const key of ['ready', 'needs-gtm', 'needs-banner', 'no-token'] as const) {
      expect(screen.getByText(STATUS_LABELS[key])).toBeTruthy();
    }
    expect(STATUS_LABELS['unreadable-token']).toBe("Token can't be read; enter it again");
  });

  it('shows the last Conversions API failure in Irish time', () => {
    const at = new Date(Date.now() - 3 * 3_600_000).toISOString();
    render(
      <TrackingStatus
        doc={{
          status: { gtm: 'off', ga4: 'off', meta: 'off', capi: 'off' },
          lastCapiFailure: { at, summary: 'Conversions API failed (HTTP 500)' },
        }}
      />,
    );
    const line = screen.getByText(/Last Conversions API failure/);
    expect(line.textContent).toContain('Irish time');
    expect(line.textContent).toContain('3 hours ago');
  });
});
