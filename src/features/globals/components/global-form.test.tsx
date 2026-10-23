// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CONFLICT_MESSAGE } from '../lib/submit-result';
import { GlobalForm } from './global-form';

const can = vi.hoisted(() => ({ value: true, impersonatedBy: null as string | null }));
vi.mock('@/contexts/actor-provider', () => ({
  useCan: () => can.value,
  useActor: () => ({ impersonatedBy: can.impersonatedBy }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const privacy = (version: number, months: number) => ({
  success: true,
  data: {
    key: 'privacy',
    version,
    updatedAt: null,
    updatedBy: null,
    value: { enquiryRetentionMonths: months, spamRetentionDays: 30 },
  },
});

let docs: ReturnType<typeof privacy>[];
let putStatus: number;

function respond(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  can.value = true;
  can.impersonatedBy = null;
  putStatus = 200;
  docs = [privacy(1, 24)];
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal('fetch', (_url: string, init: RequestInit = {}) => {
    if (init.method === 'PUT') {
      return putStatus === 409
        ? respond(
            {
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'Version conflict',
                current: { version: 2, updatedAt: null, updatedBy: 'Alex' },
              },
            },
            409,
          )
        : respond({ success: true, data: { key: 'privacy', version: 2, updatedAt: null, value: {} } });
    }
    return respond(docs.length > 1 ? docs.shift() : docs[0]);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const renderForm = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GlobalForm settingKey='privacy' />
    </QueryClientProvider>,
  );
};

describe('GlobalForm', () => {
  it('shows a disabled fieldset and no Save for a role that can read but not update', async () => {
    can.value = false;
    renderForm();
    const field = await screen.findByLabelText('Keep enquiries for (months)');
    expect(field.closest('fieldset')?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /^Save/ })).toBeNull();
    // Reading history stays available.
    expect(screen.getByRole('button', { name: 'History' })).toBeTruthy();
  });

  it('is read-only while viewing as another user, even for a role that can update', async () => {
    can.impersonatedBy = 'owner-id';
    renderForm();
    const field = await screen.findByLabelText('Keep enquiries for (months)');
    expect(field.closest('fieldset')?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /^Save/ })).toBeNull();
  });

  it('offers Save to a role that can update', async () => {
    renderForm();
    await screen.findByLabelText('Keep enquiries for (months)');
    expect(screen.getByRole('button', { name: 'Save privacy' })).toBeTruthy();
  });

  it('keeps the conflict message after the form reloads with the other version', async () => {
    putStatus = 409;
    // First load is version 1; after the conflict the refetch returns the winner's version 2.
    docs = [privacy(1, 24), privacy(2, 36)];
    renderForm();
    const field = (await screen.findByLabelText('Keep enquiries for (months)')) as HTMLInputElement;
    expect(field.value).toBe('24');

    fireEvent.click(screen.getByRole('button', { name: 'Save privacy' }));

    // The reloaded form (new key) shows the other person's value and the notice survives the remount.
    await waitFor(() => {
      expect((screen.getByLabelText('Keep enquiries for (months)') as HTMLInputElement).value).toBe('36');
    });
    expect((await screen.findByRole('alert')).textContent).toBe(CONFLICT_MESSAGE);
    expect(CONFLICT_MESSAGE).toBe(
      'Someone else saved this a moment ago. Their version is loaded; make your change again.',
    );
  });

  it('clears the conflict message on the next submit', async () => {
    putStatus = 409;
    docs = [privacy(1, 24), privacy(2, 36)];
    renderForm();
    await screen.findByLabelText('Keep enquiries for (months)');
    fireEvent.click(screen.getByRole('button', { name: 'Save privacy' }));
    await screen.findByText(CONFLICT_MESSAGE);

    putStatus = 200;
    fireEvent.click(screen.getByRole('button', { name: 'Save privacy' }));
    await waitFor(() => expect(screen.queryByText(CONFLICT_MESSAGE)).toBeNull());
  });
});
